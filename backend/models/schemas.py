from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, Any
from enum import Enum


class DeliveryMethod(str, Enum):
    SLACK = "slack"
    DISCORD = "discord"
    EMAIL = "email"


class DigestRequest(BaseModel):
    repo: str = Field(..., description="GitHub repository in 'owner/repo' format")
    delivery_method: DeliveryMethod = Field(
        ..., description="Delivery method for the digest"
    )
    webhook_url: Optional[HttpUrl] = Field(
        None, description="Custom webhook URL (overrides default)"
    )
    email: Optional[str] = Field(
        None,
        description="Email address for delivery (required if delivery_method is email)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "repo": "octocat/Hello-World",
                "delivery_method": "slack",
                "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
            }
        }


class DigestResponse(BaseModel):
    success: bool
    message: str
    summary: str
    repo_name: str
    delivery_status: str
    metrics_json: Optional[Dict[str, Any]] = None
