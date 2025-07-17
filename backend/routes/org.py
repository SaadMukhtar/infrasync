from fastapi import APIRouter, HTTPException, Request, Cookie, Path, Query
from pydantic import BaseModel
from services.org import OrgService
from utils.jwt import verify_jwt_token, create_jwt_token
from typing import List
from services.audit import AuditLogService
from supabase import create_client
from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from services.digest import DigestService

router = APIRouter(prefix="/org")
org_service = OrgService()
audit_service = AuditLogService()

class CreateOrgRequest(BaseModel):
    name: str

class JoinOrgRequest(BaseModel):
    invite_code: str

class UpdateOrgRequest(BaseModel):
    name: str

class InviteMemberRequest(BaseModel):
    email: str
    role: str

class UpdateMemberRoleRequest(BaseModel):
    role: str

class OrgMember(BaseModel):
    user_id: str
    username: str
    email: str
    role: str

@router.get("")
def get_org_info(jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    org_id = payload["org_id"]
    user_id = payload["sub"]
    result, error = org_service.get_org_info(org_id, user_id)
    if error:
        raise HTTPException(status_code=401, detail=error)
    return result

@router.get("/members")
def get_org_members(jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    org_id = payload["org_id"]
    result, error = org_service.get_org_members(org_id)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return {"members": result}

@router.post("/invite")
def invite_member(body: InviteMemberRequest, jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite members")
    org_id = payload["org_id"]
    result, error = org_service.invite_member(org_id, body.email, body.role)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Audit log
    audit_service.log_action(
        org_id=org_id,
        actor_id=payload["sub"],
        action="member_invited",
        target_type="member",
        target_id=body.email,
        details={"role": body.role}
    )
    return result

@router.patch("/members/{user_id}/role")
def update_member_role(
    user_id: str = Path(...),
    body: UpdateMemberRoleRequest = None,
    jwt_token: str = Cookie(None)
):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change member roles")
    org_id = payload["org_id"]
    result, error = org_service.update_member_role(org_id, user_id, body.role)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Audit log
    audit_service.log_action(
        org_id=org_id,
        actor_id=payload["sub"],
        action="member_role_changed",
        target_type="member",
        target_id=user_id,
        details={"new_role": body.role}
    )
    return result

@router.delete("/members/{user_id}")
def remove_member(user_id: str = Path(...), jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can remove members")
    if payload.get("sub") == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the organization")
    org_id = payload["org_id"]
    result, error = org_service.remove_member(org_id, user_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Audit log
    audit_service.log_action(
        org_id=org_id,
        actor_id=payload["sub"],
        action="member_removed",
        target_type="member",
        target_id=user_id,
        details={}
    )
    return result

@router.patch("")
def update_org(body: UpdateOrgRequest, jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update organization")
    org_id = payload["org_id"]
    result, error = org_service.update_org_name(org_id, body.name)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result

@router.post("")
def create_org(body: CreateOrgRequest, jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = payload["sub"]
    user_email = payload.get("email")
    result, error = org_service.create_org(body.name, user_id, user_email)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Issue new JWT
    new_jwt = create_jwt_token({
        "sub": user_id,
        "username": payload.get("username"),
        "email": payload.get("email"),
        "org_id": result["org_id"],
        "role": result["role"]
    })
    return {"org_id": result["org_id"], "name": result["name"], "jwt": new_jwt}

@router.post("/join")
def join_org(body: JoinOrgRequest, jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = payload["sub"]
    result, error = org_service.join_org(body.invite_code, user_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Issue new JWT
    new_jwt = create_jwt_token({
        "sub": user_id,
        "username": payload.get("username"),
        "email": payload.get("email"),
        "org_id": result["org_id"],
        "role": result["role"]
    })
    return {"org_id": result["org_id"], "name": result["name"], "jwt": new_jwt}

@router.get("/audit-logs")
def get_audit_logs(jwt_token: str = Cookie(None), limit: int = Query(50, le=100)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view audit logs")
    org_id = payload["org_id"]
    logs = audit_service.get_org_logs(org_id, limit=limit)
    return {"logs": [log.dict() for log in logs]}

@router.delete("")
def disband_org(jwt_token: str = Cookie(None)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can disband the organization")
    org_id = payload["org_id"]
    result, error = org_service.disband_org(org_id)
    if error:
        raise HTTPException(status_code=500, detail=error)
    return result

@router.post("/cleanup")
def cleanup_deleted_orgs(days_old: int = Query(30, description="Delete orgs older than N days"), jwt_token: str = Cookie(None)):
    """Admin endpoint to clean up soft-deleted orgs (requires admin role)"""
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can trigger cleanup")
    
    deleted_count, message = org_service.cleanup_deleted_orgs(days_old)
    return {
        "message": message,
        "deleted_count": deleted_count,
        "days_old": days_old
    }

@router.get("/metrics")
def get_org_metrics(jwt_token: str = Cookie(None), period_days: int = Query(7, ge=1, le=90)):
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="Invalid or missing org context")
    org_id = payload["org_id"]
    digest_service = DigestService()
    metrics = digest_service.aggregate_metrics(org_id=org_id, period_days=period_days)
    return {"metrics": metrics, "period_days": period_days} 