from models.audit import AuditLog
from uuid import uuid4
from datetime import datetime
from supabase import create_client, Client
import os
from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

class AuditLogService:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase environment variables not set")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    def log_action(self, org_id, actor_id, action, target_type, target_id, details=None):
        details = details or {}
        log = {
            "id": str(uuid4()),
            "org_id": str(org_id),
            "actor_id": str(actor_id),
            "action": action,
            "target_type": target_type,
            "target_id": str(target_id),
            "details": details,
            "created_at": datetime.utcnow().isoformat()
        }
        self.client.table("audit_logs").insert(log).execute()

    def get_org_logs(self, org_id, limit=50):
        result = (
            self.client
            .table("audit_logs")
            .select("*")
            .eq("org_id", str(org_id))
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        if not result or not result.data:
            return []
        return [AuditLog(**row) for row in result.data] 