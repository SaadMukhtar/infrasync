from pydantic import BaseModel
from typing import Any, Dict
from uuid import UUID
from datetime import datetime


class AuditLog(BaseModel):
    id: UUID
    org_id: UUID
    actor_id: str
    action: str  # e.g. 'monitor_created', 'monitor_deleted', 'member_added', etc.
    target_type: str  # e.g. 'monitor', 'member', 'org'
    target_id: str
    details: Dict[str, Any] = {}
    created_at: datetime
