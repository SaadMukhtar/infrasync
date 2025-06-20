from fastapi import APIRouter, HTTPException, Request
from models.schemas import DigestRequest, DigestResponse
from services.github import GitHubService
from services.gpt import GPTService
from delivery.slack import SlackService
from delivery.discord import DiscordService
from delivery.email import EmailService
from config import limiter
from services.digest import DigestService
from services.monitor import MonitorService
from datetime import datetime
import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/digest", response_model=DigestResponse)
@limiter.limit("50/minute")
async def create_digest(request: Request, body: DigestRequest) -> DigestResponse:
    """
    Generate and deliver a digest of recent repository activity.
    """

    try:
        # Extra validation for repo format (owner/repo)
        if not body.repo or "/" not in body.repo or len(body.repo.split("/")) != 2:
            raise HTTPException(
                status_code=400, detail="repo must be in the format 'owner/repo'"
            )
        owner, repo = body.repo.split("/")
        if not owner or not repo:
            raise HTTPException(
                status_code=400, detail="repo must be in the format 'owner/repo'"
            )

        # Initialize services
        github_service: GitHubService = GitHubService()
        gpt_service: GPTService = GPTService()
        digest_service: DigestService = DigestService()
        monitor_service: MonitorService = MonitorService()

        # Fetch monitor to get org_id and user token for private repos
        logger.info(
            f"Looking up monitor for repo={body.repo}, webhook_url={body.webhook_url}"
        )
        monitor = await monitor_service.get_by_repo_and_webhook(
            body.repo, str(body.webhook_url) if body.webhook_url else ""
        )
        if not monitor:
            logger.error(
                f"No active monitor found for repo={body.repo}, webhook_url={body.webhook_url}"
            )
            raise HTTPException(
                status_code=404,
                detail="No active monitor found for this repo and webhook.",
            )

        # For private repos, use org user's GitHub token
        github_token = None
        if getattr(monitor, "is_private", False):
            from services.user import get_user_github_token

            github_token = await get_user_github_token(monitor.created_by)
            if not github_token:
                logger.error(f"No GitHub token found for private repo: {body.repo}")
                raise HTTPException(
                    status_code=403, detail="No GitHub token found for private repo."
                )
            logger.info(f"Using org user's GitHub token for private repo: {body.repo}")
            github_service = GitHubService(github_token=github_token)
        else:
            github_token = None  # Use default token in GitHubService

        # Fetch repository data
        logger.info(f"Fetching data for repository: {body.repo}")
        repo_data = await github_service.fetch_repository_data(
            str(body.repo), github_token=github_token
        )

        # Generate summary
        logger.info("Generating GPT summary")
        summary = await gpt_service.generate_digest_summary(
            summary_counts=repo_data["summary_counts"],
            grouped_commits=repo_data["grouped_commits"],
            repo_name=repo_data["repository"]["full_name"],
        )

        # Deliver via specified method
        delivery_status = "pending"
        error_message = None
        success = False
        if body.delivery_method == "slack":
            slack_service = SlackService()
            if body.webhook_url is None:
                raise HTTPException(
                    status_code=400, detail="Slack webhook URL required"
                )
            success = await slack_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=f"https://github.com/{body.repo}",
                webhook_url=str(body.webhook_url),
            )
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Slack"
        elif body.delivery_method == "discord":
            discord_service = DiscordService()
            if body.webhook_url is None:
                raise HTTPException(
                    status_code=400, detail="Discord webhook URL required"
                )
            success = await discord_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(body.repo),
                webhook_url=str(body.webhook_url),
            )
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Discord"
        elif body.delivery_method == "email":
            if not body.email:
                raise HTTPException(
                    status_code=400, detail="Email address required for email delivery"
                )
            email_service = EmailService()
            success = await email_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(body.repo),
                email=body.email,
            )
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Email"

        # Defensive: ensure monitor_id is a valid UUID for logging digests
        monitor_id_str = (
            str(monitor.id) if monitor and getattr(monitor, "id", None) else None
        )
        try:
            if monitor_id_str:
                uuid.UUID(monitor_id_str)
            else:
                monitor_id_str = None
        except Exception:
            logger.error(f"Invalid monitor_id for digest log: {monitor_id_str}")
            monitor_id_str = None

        metrics = extract_metrics(
            repo_data["summary_counts"], repo_data["grouped_commits"]
        )
        # Log the digest only if monitor_id is valid
        if monitor_id_str:
            digest_service.log_digest(
                monitor_id=monitor_id_str,
                summary=summary,
                status=delivery_status,
                delivered_at=datetime.utcnow().isoformat(),
                delivery_method=(
                    body.delivery_method.value
                    if hasattr(body.delivery_method, "value")
                    else str(body.delivery_method)
                ),
                error_message=error_message or "",
                created_by=monitor.created_by if monitor else "",
                raw_payload=None,  # Optionally log raw data
                metrics_json=metrics,
            )
        else:
            logger.error(
                f"Skipping digest log due to invalid monitor_id: {monitor_id_str}"
            )

        return DigestResponse(
            success=True,
            message=f"Digest generated and delivered via {body.delivery_method.value}",
            summary=summary,
            repo_name=repo_data["repository"]["full_name"],
            delivery_status=delivery_status,
            metrics_json=metrics,
        )

    except Exception as e:
        # Improved error logging
        logger.error(f"Error creating digest: {str(e)}", exc_info=True)
        try:
            logger.error(f"Request body: {body.dict()}")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/digest/try", response_model=DigestResponse)
@limiter.limit("3/hour")
async def try_digest(request: Request, body: DigestRequest) -> DigestResponse:
    """
    Demo endpoint for sending instant digests without affecting metrics.

    This endpoint:
    1. Fetches recent activity from the specified GitHub repository
    2. Generates a GPT-powered summary of the activity
    3. Delivers the summary via Slack only (demo mode)
    4. DOES NOT log to database (demo only)
    5. Adds a demo indicator to the message
    6. No authentication required (public demo)
    """
    try:
        # Extra validation for repo format (owner/repo)
        if not body.repo or "/" not in body.repo or len(body.repo.split("/")) != 2:
            raise HTTPException(
                status_code=400, detail="repo must be in the format 'owner/repo'"
            )
        owner, repo = body.repo.split("/")
        if not owner or not repo:
            raise HTTPException(
                status_code=400, detail="repo must be in the format 'owner/repo'"
            )

        # Restrict to Slack only for demo
        if body.delivery_method != "slack":
            raise HTTPException(
                status_code=400, detail="Demo currently supports Slack only"
            )

        # Require webhook URL for demo
        if not body.webhook_url:
            raise HTTPException(
                status_code=400, detail="Slack webhook URL required for demo"
            )

        # Initialize services
        github_service: GitHubService = GitHubService()
        gpt_service: GPTService = GPTService()

        # Fetch repository data
        logger.info(f"[DEMO] Fetching data for repository: {body.repo}")
        repo_data = await github_service.fetch_repository_data(str(body.repo))

        # Generate summary
        logger.info("[DEMO] Generating GPT summary")
        summary = await gpt_service.generate_digest_summary(
            summary_counts=repo_data["summary_counts"],
            grouped_commits=repo_data["grouped_commits"],
            repo_name=repo_data["repository"]["full_name"],
        )

        # Add demo indicator to summary
        demo_summary = f"🎯 **DEMO DIGEST** - This is a one-time demo digest from Infrasync\n\n{summary}"

        # Deliver via Slack only
        delivery_status = "pending"
        error_message = None
        success = False

        slack_service = SlackService()
        success = await slack_service.send_digest(
            summary=demo_summary,
            repo_name=repo_data["repository"]["full_name"],
            repo_url=f"https://github.com/{body.repo}",
            webhook_url=str(body.webhook_url),
        )
        delivery_status = "success" if success else "failure"
        if not success:
            error_message = "Failed to deliver to Slack"
            logger.error(error_message)
        else:
            # DO NOT log to database - this is demo only!
            logger.info("[DEMO] Digest sent successfully via Slack (not logged to DB)")

        return DigestResponse(
            success=True,
            message="Demo digest sent via Slack (not logged to metrics)",
            summary=demo_summary,
            repo_name=repo_data["repository"]["full_name"],
            delivery_status=delivery_status,
        )

    except Exception as e:
        logger.error(f"[DEMO] Error creating demo digest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_metrics(
    summary_counts: dict[str, Any], grouped_commits: dict[str, Any]
) -> dict[str, Any]:
    return {
        "prs_opened": int(summary_counts.get("prs_opened", 0) or 0),
        "prs_closed": int(summary_counts.get("prs_closed", 0) or 0),
        "issues_opened": int(summary_counts.get("issues_opened", 0) or 0),
        "issues_closed": int(summary_counts.get("issues_closed", 0) or 0),
        "bugfixes": len(list(grouped_commits.get("bugfixes", []) or [])),
        "docs": len(list(grouped_commits.get("docs", []) or [])),
        "features": len(list(grouped_commits.get("features", []) or [])),
        "refactors": len(list(grouped_commits.get("refactors", []) or [])),
        "perf": len(list(grouped_commits.get("perf", []) or [])),
    }
