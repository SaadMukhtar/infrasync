from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Literal, Optional
from uuid import UUID
from datetime import datetime


class Monitor(BaseModel):
    id: UUID
    org_id: UUID
    repo: str
    delivery_method: Literal["slack", "discord", "email"]
    webhook_url: HttpUrl
    frequency: Literal["daily", "weekly", "on_merge"]
    created_at: datetime
    is_private: bool
    created_by: str

    class Config:
        json_encoders = {
            UUID: str,
            HttpUrl: str,
            datetime: lambda v: v.isoformat(),
        }


class MonitorCreate(BaseModel):
    org_id: Optional[UUID] = None
    repo: str = Field(..., description="GitHub repository in 'owner/repo' format")
    delivery_method: Literal["slack", "discord", "email"]
    webhook_url: HttpUrl
    frequency: Literal["daily", "weekly", "on_merge"]

    @validator("repo")
    def validate_repo_format(cls, v: str) -> str:
        if not v or "/" not in v or len(v.split("/")) != 2:
            raise ValueError("repo must be in the format 'owner/repo'")
        owner, repo = v.split("/")
        if not owner or not repo:
            raise ValueError("repo must be in the format 'owner/repo'")
        return v
