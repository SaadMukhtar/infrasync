import httpx
import logging
from typing import Any

logger = logging.getLogger(__name__)


class SlackService:

    async def send_digest(
        self, summary: str, repo_name: str, repo_url: str, webhook_url: str
    ) -> bool:
        """Send repository digest to Slack via webhook."""
        try:
            webhook = webhook_url
            if not webhook:
                raise ValueError("No Slack webhook URL provided")

            message = self._format_message(summary, repo_name, repo_url)

            async with httpx.AsyncClient() as client:
                response = await client.post(webhook, json=message, timeout=10.0)

                if response.status_code == 200:
                    logger.info(f"Successfully sent digest to Slack for {repo_name}")
                    return True
                else:
                    logger.error(
                        f"Failed to send to Slack: {response.status_code} - {response.text}"
                    )
                    return False

        except Exception as e:
            logger.error(f"Error sending to Slack: {str(e)}")
            return False

    def _format_message(
        self, summary: str, repo_name: str, repo_url: str
    ) -> dict[str, Any]:
        """Format the message for Slack with clickable repo name in the title."""
        return {
            "text": f"📊 Daily Digest: {repo_name}",
            "blocks": [
                {"type": "divider"},
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*📊 Daily Digest: <{repo_url}|{repo_name}>*",
                    },
                },
                {"type": "section", "text": {"type": "mrkdwn", "text": summary}},
            ],
        }
