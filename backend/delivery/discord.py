import logging
from typing import Optional

logger = logging.getLogger(__name__)


class DiscordService:
    def __init__(self) -> None:
        # TODO: Implement Discord webhook integration
        pass

    async def send_digest(
        self,
        summary: str,
        repo_name: str,
        repo_url: str,
        webhook_url: Optional[str] = None,
    ) -> bool:
        """Send repository digest to Discord via webhook."""
        # TODO: Implement Discord webhook sending
        logger.info(f"Discord delivery not yet implemented for {repo_name}")
        return False
