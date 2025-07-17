from models.monitor import Monitor, MonitorCreate
from uuid import uuid4
from datetime import datetime
from supabase import create_client, Client
import os
import logging
from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from services.github import GitHubService
import httpx
from typing import List, Optional
from pydantic import BaseModel


logger = logging.getLogger(__name__)

class MonitorService:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.info(dict(os.environ))
            raise ValueError("Supabase environment variables not set")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        self.github_service = GitHubService()

    async def get_by_repo_and_webhook(self, repo: str, webhook_url: str):
        try:
            result = (
                self.client
                .table("monitors")
                .select("*")
                .eq("repo", repo)
                .eq("webhook_url", webhook_url)
                .eq("deleted", False)
                .maybe_single()
                .execute()
            )
            if result is not None and result.data:
                return Monitor(**result.data)
            return None
        except Exception as e:
            logger.error(f"Error in get_by_repo_and_webhook: {e}")
            return None

    async def create_monitor(self, data: MonitorCreate, created_by: str, github_token: str = None) -> Monitor:
        # Check if repo is private
        is_private = False
        if github_token:
            try:
                is_private = await self.github_service.is_repo_private(data.repo, github_token)
            except Exception as e:
                logger.error(f"Failed to check repo privacy: {e}")
                raise Exception("Failed to check if repo is private. Please check your GitHub token.")
        else:
            # If no token, only allow public repos
            # We'll optimistically assume public, but will fail if private
            pass
        if is_private and not github_token:
            raise Exception("A GitHub token is required to monitor private repositories.")

        monitor = Monitor(
            id=uuid4(),
            org_id=data.org_id,
            repo=data.repo,
            delivery_method=data.delivery_method,
            webhook_url=str(data.webhook_url),
            frequency=data.frequency,
            created_at=datetime.utcnow(),
            is_private=is_private,
            created_by=created_by
        )
        monitor_dict = {
            "id": str(monitor.id),
            "org_id": str(monitor.org_id),
            "repo": monitor.repo,
            "delivery_method": monitor.delivery_method,
            "webhook_url": str(monitor.webhook_url),
            "frequency": monitor.frequency,
            "created_at": monitor.created_at.isoformat(),
            "is_private": is_private,
            "created_by": created_by
        }
        insert_result = (
            self.client
            .table("monitors")
            .insert(monitor_dict)
            .execute()
        )
        if not insert_result or insert_result.data is None:
            raise Exception(f"Insert failed: {insert_result}")
        return monitor

    async def list_monitors(self, org_id: str):
        result = self.client.table("monitors").select("*").eq("org_id", org_id).eq("deleted", False).execute()
        if not result or not result.data:
            return []
        return [Monitor(**row) for row in result.data]

    async def delete_monitor(self, monitor_id: str, org_id: str):
        # Fetch the monitor first
        result = self.client.table("monitors").select("*").eq("id", monitor_id).eq("org_id", org_id).eq("deleted", False).maybe_single().execute()
        if not result or not result.data:
            logger.warning(f"Monitor {monitor_id} not found for deletion in org {org_id}")
            return None
        monitor_data = result.data
        # Soft delete the monitor
        del_result = self.client.table("monitors").update({
            "deleted": True,
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", monitor_id).eq("org_id", org_id).execute()
        if del_result and del_result.data:
            logger.info(f"Soft deleted monitor {monitor_id} for org {org_id}")
            return monitor_data
        logger.warning(f"Monitor {monitor_id} not found for deletion in org {org_id}")
        return None

    async def update_monitor_frequency(self, monitor_id: str, new_freq: str, org_id: str) -> bool:
        result = self.client.table("monitors").update({"frequency": new_freq}).eq("id", monitor_id).eq("org_id", org_id).eq("deleted", False).execute()
        if result and result.data:
            logger.info(f"Updated monitor {monitor_id} frequency to {new_freq} for org {org_id}")
            return True
        logger.warning(f"Monitor {monitor_id} not found or not updated in org {org_id}")
        return False
