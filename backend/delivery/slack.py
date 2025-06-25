import httpx
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SlackService:
    def __init__(self):
        self.default_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    async def send_digest(self, summary: str, repo_name: str, repo_url: str, webhook_url: Optional[str] = None) -> bool:
        """Send repository digest to Slack via webhook."""
        try:
            webhook = webhook_url or self.default_webhook_url
            if not webhook:
                raise ValueError("No Slack webhook URL provided")
            
            message = self._format_message(summary, repo_name, repo_url)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook,
                    json=message,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully sent digest to Slack for {repo_name}")
                    return True
                else:
                    logger.error(f"Failed to send to Slack: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending to Slack: {str(e)}")
            return False
    
    def _format_message(self, summary: str, repo_name: str, repo_url: str) -> dict:
        """Format the message for Slack."""
        return {
            "text": f"📊 GitHub Summary: {repo_name}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"📊 GitHub Summary: {repo_name}"
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Here's a snapshot of what's changed in the past 24 hours."
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": summary
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"🔗 <{repo_url}|View Repository on GitHub>"
                        }
                    ]
                },
                {
                    "type": "divider"
                }
            ]
        } 