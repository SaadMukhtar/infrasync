from fastapi import APIRouter, HTTPException, status, Request, Path, Depends, Query
from models.monitor import Monitor, MonitorCreate
from services.monitor import MonitorService
from config import limiter, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from typing import List
import logging
from uuid import UUID
from utils.jwt import verify_jwt_token
from fastapi import Cookie
from services.user import get_user_github_token
from services.audit import AuditLogService
from supabase import create_client
from services.digest import DigestService
from services.org import OrgService

router = APIRouter()
service = MonitorService()
audit_service = AuditLogService()
digest_service = DigestService()
org_service = OrgService()

logger = logging.getLogger(__name__)

# Dependency to extract org_id and role from JWT
async def get_org_context(jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    return {"org_id": payload["org_id"], "role": payload.get("role")}

@router.get("/monitor")
@limiter.limit("100/minute")
async def list_monitors(request: Request, org=Depends(get_org_context)):
    monitors = await service.list_monitors(str(org["org_id"]))
    return {"monitors": monitors}

@router.post("/monitor", response_model=Monitor, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_monitor(request: Request, config: MonitorCreate, org=Depends(get_org_context), jwt_token: str = Cookie(None)):
    # Validate repo format (redundant if using Pydantic validator, but explicit for clarity)
    if "/" not in config.repo or len(config.repo.split("/")) != 2:
        raise HTTPException(status_code=400, detail="repo must be in the format 'owner/repo'")
    # Overwrite org_id to ensure security
    config.org_id = org["org_id"]
    # Get user_id from JWT
    payload = verify_jwt_token(jwt_token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    # Fetch org and monitor count for plan enforcement
    org_obj = org_service.supabase.table("organizations").select("*").eq("id", org["org_id"]).single().execute()
    if not org_obj.data:
        raise HTTPException(status_code=404, detail="Org not found")
    monitor_count = org_service.supabase.table("monitors").select("id", count="exact").eq("org_id", org["org_id"]).eq("deleted", False).execute().count or 0
    org_service.enforce_plan_limits(org_obj.data, "repo", monitor_count)
    # Enforce unique Slack webhook per org (and globally for free plan)
    if config.delivery_method == "slack" and config.webhook_url:
        # Allow multiple monitors in the same org to use the same webhook
        # Block if another org (not deleted) is using this webhook
        if org_service.is_webhook_used_by_other_org(config.webhook_url, org["org_id"]):
            raise HTTPException(400, detail="This Slack webhook is already used by another organization. Upgrade your plan to use this destination.")
    # Fetch user's GitHub token
    github_token = await get_user_github_token(user_id)
    try:
        monitor = await service.create_monitor(config, created_by=user_id, github_token=github_token)
        # Audit log
        audit_service.log_action(
            org_id=org["org_id"],
            actor_id=user_id,
            action="monitor_created",
            target_type="monitor",
            target_id=str(monitor.id),
            details={
                "repo": monitor.repo,
                "delivery_method": monitor.delivery_method,
                "frequency": monitor.frequency
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return monitor

@router.delete("/monitor/{monitor_id}")
@limiter.limit("5/minute")
async def delete_monitor(monitor_id: str, request: Request, org=Depends(get_org_context), jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    user_id = payload.get("sub")
    monitor = await service.delete_monitor(monitor_id, str(org["org_id"]))
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    # Audit log
    audit_service.log_action(
        org_id=org["org_id"],
        actor_id=user_id,
        action="monitor_deleted",
        target_type="monitor",
        target_id=monitor_id,
        details={"repo": monitor.get("repo")}
    )
    return {"message": "Monitor deleted"}

@router.patch("/monitor/{monitor_id}")
@limiter.limit("5/minute")
async def update_monitor_frequency(monitor_id: str, data: dict, request: Request, org=Depends(get_org_context)):
    new_freq = data.get("frequency")
    if not new_freq:
        raise HTTPException(status_code=400, detail="Missing frequency")
    updated = await service.update_monitor_frequency(monitor_id, new_freq, str(org["org_id"]))
    if not updated:
        raise HTTPException(status_code=404, detail="Monitor not found or not updated")
    return {"message": "Monitor updated"}

@router.get("/monitor/{monitor_id}/digests")
async def get_monitor_digests(monitor_id: str, org=Depends(get_org_context), limit: int = Query(5, le=20)):
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    # Only allow access to monitors in this org
    monitor_result = client.table("monitors").select("id, org_id").eq("id", monitor_id).maybe_single().execute()
    if not monitor_result or not monitor_result.data or str(monitor_result.data["org_id"]) != str(org["org_id"]):
        raise HTTPException(status_code=404, detail="Monitor not found")
    digests = digest_service.get_monitor_digests(monitor_id, limit)
    return {"digests": digests}

@router.get("/monitor/{monitor_id}/metrics")
async def get_monitor_metrics(
    monitor_id: str,
    org=Depends(get_org_context),
    period_days: int = Query(7, ge=1, le=90),
    compare_to_previous: bool = Query(False)
):
    # Only allow access to monitors in this org
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    monitor_result = client.table("monitors").select("id, org_id").eq("id", monitor_id).maybe_single().execute()
    if not monitor_result or not monitor_result.data or str(monitor_result.data["org_id"]) != str(org["org_id"]):
        raise HTTPException(status_code=404, detail="Monitor not found")
    digest_service = DigestService()
    metrics = digest_service.aggregate_metrics(monitor_id=monitor_id, period_days=period_days)
    if compare_to_previous:
        previous_metrics = digest_service.aggregate_metrics(monitor_id=monitor_id, period_days=period_days, offset_days=period_days)
        return {"metrics": metrics, "previous_metrics": previous_metrics, "period_days": period_days}
    return {"metrics": metrics, "period_days": period_days}

@router.get("/monitor/{monitor_id}/metrics/timeseries")
async def get_monitor_metrics_timeseries(
    monitor_id: str,
    org=Depends(get_org_context),
    period_days: int = Query(30, ge=1, le=90)
):
    # Only allow access to monitors in this org
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    monitor_result = client.table("monitors").select("id, org_id").eq("id", monitor_id).maybe_single().execute()
    if not monitor_result or not monitor_result.data or str(monitor_result.data["org_id"]) != str(org["org_id"]):
        raise HTTPException(status_code=404, detail="Monitor not found")
    digest_service = DigestService()
    timeseries = digest_service.timeseries_metrics(monitor_id=monitor_id, period_days=period_days)
    return {"timeseries": timeseries, "period_days": period_days}
