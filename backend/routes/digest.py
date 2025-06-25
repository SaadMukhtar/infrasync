from fastapi import APIRouter, HTTPException
from models.config import DigestRequest, DigestResponse
from services.github import GitHubService
from services.gpt import GPTService
from delivery.slack import SlackService
from delivery.discord import DiscordService
from delivery.email import EmailService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/digest", response_model=DigestResponse)
async def create_digest(request: DigestRequest):
    """
    Generate and deliver a digest of recent repository activity.
    
    This endpoint:
    1. Fetches recent activity from the specified GitHub repository
    2. Generates a GPT-powered summary of the activity
    3. Delivers the summary via the specified method (Slack/Discord/Email)
    4. Returns the summary in the response for debugging
    """
    try:
        # Initialize services
        github_service = GitHubService()
        gpt_service = GPTService()
        
        # Fetch repository data
        logger.info(f"Fetching data for repository: {request.repo_url}")
        repo_data = await github_service.fetch_repository_data(str(request.repo_url))
        
        # Generate summary
        logger.info("Generating GPT summary")
        summary = await gpt_service.generate_digest_summary(
            summary_counts=repo_data["summary_counts"],
            grouped_commits=repo_data["grouped_commits"],
            repo_name=repo_data["repository"]["full_name"],
        )
        
        # Deliver via specified method
        delivery_status = "pending"
        
        if request.delivery_method == "slack":
            slack_service = SlackService()
            success = await slack_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(request.repo_url),
                webhook_url=str(request.webhook_url) if request.webhook_url else None
            )
            delivery_status = "delivered" if success else "failed"
            
        elif request.delivery_method == "discord":
            discord_service = DiscordService()
            success = await discord_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(request.repo_url),
                webhook_url=str(request.webhook_url) if request.webhook_url else None
            )
            delivery_status = "delivered" if success else "failed"
            
        elif request.delivery_method == "email":
            if not request.email:
                raise HTTPException(status_code=400, detail="Email address required for email delivery")
            
            email_service = EmailService()
            success = await email_service.send_digest(
                summary=summary,
                repo_name=repo_data["repository"]["full_name"],
                repo_url=str(request.repo_url),
                email=request.email
            )
            delivery_status = "delivered" if success else "failed"
        
        return DigestResponse(
            success=True,
            message=f"Digest generated and delivered via {request.delivery_method.value}",
            summary=summary,
            repo_name=repo_data["repository"]["full_name"],
            delivery_status=delivery_status
        )
        
    except Exception as e:
        logger.error(f"Error creating digest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 