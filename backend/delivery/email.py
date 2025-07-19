import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self) -> None:
        # TODO: Implement email delivery via SMTP
        pass

    async def send_digest(
        self, summary: str, repo_name: str, repo_url: str, email: str
    ) -> bool:
        """Send repository digest via email."""
        # TODO: Implement email sending via SMTP
        logger.info(f"Email delivery not yet implemented for {repo_name} to {email}")
        return False
