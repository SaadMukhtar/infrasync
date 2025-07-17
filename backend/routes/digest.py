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

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/digest", response_model=DigestResponse)
@limiter.limit("5/minute")
async def create_digest(request: Request, body: DigestRequest):
    """
    Generate and deliver a digest of recent repository activity.
    
    This endpoint:
    1. Fetches recent activity from the specified GitHub repository
    2. Generates a GPT-powered summary of the activity
    3. Delivers the summary via the specified method (Slack/Discord/Email)
    4. Returns the summary in the response for debugging
    """
    try:
        # Extra validation for repo format (owner/repo)
        if not body.repo or "/" not in body.repo or len(body.repo.split("/")) != 2:
            raise HTTPException(status_code=400, detail="repo must be in the format 'owner/repo'")
        owner, repo = body.repo.split("/")
        if not owner or not repo:
            raise HTTPException(status_code=400, detail="repo must be in the format 'owner/repo'")

        # Initialize services
        github_service = GitHubService()
        gpt_service = GPTService()
        digest_service = DigestService()
        monitor_service = MonitorService()
        
        # Fetch repository data
        logger.info(f"Fetching data for repository: {body.repo}")
        repo_data = await github_service.fetch_repository_data(str(body.repo))
        
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
            success = await slack_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=f"https://github.com/{body.repo}",
                webhook_url=str(body.webhook_url) if body.webhook_url else None
            )
            logger.info(f"saad {body.webhook_url}")
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Slack"
        elif body.delivery_method == "discord":
            discord_service = DiscordService()
            success = await discord_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(body.repo),
                webhook_url=str(body.webhook_url) if body.webhook_url else None
            )
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Discord"
        elif body.delivery_method == "email":
            if not body.email:
                raise HTTPException(status_code=400, detail="Email address required for email delivery")
            email_service = EmailService()
            success = await email_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(body.repo),
                email=body.email
            )
            delivery_status = "success" if success else "failure"
            if not success:
                error_message = "Failed to deliver to Email"
        # Log monitor lookup inputs
        logger.info(f"Looking up monitor for repo={body.repo}, webhook_url={body.webhook_url}")
        monitor = await monitor_service.get_by_repo_and_webhook(body.repo, str(body.webhook_url) if body.webhook_url else "")
        if not monitor:
            logger.error(f"No active monitor found for repo={body.repo}, webhook_url={body.webhook_url}")
            raise HTTPException(status_code=404, detail="No active monitor found for this repo and webhook.")
        else:
            metrics = extract_metrics(repo_data["summary_counts"], repo_data["grouped_commits"])
            digest_service.log_digest(
                monitor_id=str(monitor.id),
                summary=summary,
                status=delivery_status,
                delivered_at=datetime.utcnow().isoformat(),
                delivery_method=body.delivery_method.value if hasattr(body.delivery_method, 'value') else str(body.delivery_method),
                error_message=error_message,
                created_by=None,  # Optionally set if you have user context
                raw_payload=None,  # Optionally log raw data
                metrics_json=metrics
            )
            # Log all monitors for this repo for debugging
            logger.error(f"No monitor found for repo={body.repo} webhook_url={body.webhook_url}. Fetching all monitors for this repo for debugging.")
            try:
                all_monitors = monitor_service.client.table("monitors").select("id, repo, webhook_url").eq("repo", body.repo).execute()
                logger.error(f"Monitors in DB for repo={body.repo}: {all_monitors.data if all_monitors and all_monitors.data else 'None'}")
            except Exception as e:
                logger.error(f"Error fetching monitors for debugging: {e}")
        return DigestResponse(
            success=True,
            message=f"Digest generated and delivered via {body.delivery_method.value}",
            summary=summary,
            repo_name=repo_data["repository"]["full_name"],
            delivery_status=delivery_status
        )
        
    except Exception as e:
        logger.error(f"Error creating digest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/digest/try", response_model=DigestResponse)
@limiter.limit("3/hour")
async def try_digest(request: Request, body: DigestRequest):
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
            raise HTTPException(status_code=400, detail="repo must be in the format 'owner/repo'")
        owner, repo = body.repo.split("/")
        if not owner or not repo:
            raise HTTPException(status_code=400, detail="repo must be in the format 'owner/repo'")

        # Restrict to Slack only for demo
        if body.delivery_method != "slack":
            raise HTTPException(status_code=400, detail="Demo currently supports Slack only")

        # Require webhook URL for demo
        if not body.webhook_url:
            raise HTTPException(status_code=400, detail="Slack webhook URL required for demo")

        # Initialize services
        github_service = GitHubService()
        gpt_service = GPTService()
        
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
            webhook_url=str(body.webhook_url)
        )
        delivery_status = "success" if success else "failure"
        if not success:
            error_message = "Failed to deliver to Slack"
        
        # DO NOT log to database - this is demo only!
        logger.info(f"[DEMO] Digest sent successfully via Slack (not logged to DB)")
        
        return DigestResponse(
            success=True,
            message=f"Demo digest sent via Slack (not logged to metrics)",
            summary=demo_summary,
            repo_name=repo_data["repository"]["full_name"],
            delivery_status=delivery_status
        )
        
    except Exception as e:
        logger.error(f"[DEMO] Error creating demo digest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def extract_metrics(summary_counts, grouped_commits):
    return {
        "prs_opened": summary_counts.get("prs_opened", 0),
        "prs_closed": summary_counts.get("prs_closed", 0),
        "issues_opened": summary_counts.get("issues_opened", 0),
        "issues_closed": summary_counts.get("issues_closed", 0),
        "bugfixes": grouped_commits.get("bugfix", []),
        "docs": grouped_commits.get("docs", []),
        "features": grouped_commits.get("feature", []),
        "refactors": grouped_commits.get("refactor", []),
        "perf": grouped_commits.get("perf", []),
    } 