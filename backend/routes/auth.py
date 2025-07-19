from fastapi import APIRouter, Request, HTTPException, Response, Cookie, Query
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import os
import httpx
from services.user import (
    get_or_create_user,
    get_user_org_and_role,
    delete_user_and_data,
    get_user_by_id,
)
from utils.jwt import create_jwt_token, verify_jwt_token
import logging
from services.org import OrgService
from cryptography.fernet import Fernet
from typing import Optional, Any

router = APIRouter()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_OAUTH_REDIRECT_URI = os.getenv(
    "GITHUB_OAUTH_REDIRECT_URI", "http://localhost:8000/api/v1/auth/github/callback"
)
GITHUB_OAUTH_SCOPE = "read:user user:email repo"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

logger = logging.getLogger(__name__)

org_service: OrgService = OrgService()

# Generate a key and store it securely (do this once)
# key = Fernet.generate_key()
# Save this key in an environment variable or secret manager

FERNET_KEY = os.environ["FERNET_KEY"]
fernet = Fernet(FERNET_KEY)


def encrypt_token(token: str) -> str:
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(token_enc: str) -> str:
    return fernet.decrypt(token_enc.encode()).decode()


@router.get("/auth/github/login")
def github_login() -> RedirectResponse:
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_OAUTH_REDIRECT_URI,
        "scope": GITHUB_OAUTH_SCOPE,
        "allow_signup": "true",
    }
    url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/auth/github/callback")
async def github_callback(request: Request, code: Optional[str] = None) -> RedirectResponse:
    if not code:
        raise HTTPException(
            status_code=400, detail="Missing code from GitHub OAuth callback"
        )
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_OAUTH_REDIRECT_URI,
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=400, detail="Failed to obtain GitHub access token"
            )
        # Fetch user profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )
        user_data = user_resp.json()
        email_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"},
        )
        emails = email_resp.json()
        primary_email = next((e["email"] for e in emails if e.get("primary")), None)
        if primary_email is None:
            raise HTTPException(status_code=400, detail="No primary email found in GitHub profile")
        # Store or update user in Supabase
        user = await get_or_create_user(
            github_id=user_data["id"],
            username=user_data["login"],
            email=primary_email,
            access_token=access_token,
        )  # type: ignore
        if not isinstance(user, dict) or "id" not in user or "username" not in user or "email" not in user:
            raise HTTPException(status_code=400, detail="User get or create failed.")
        # Get org context
        org_id, role = await get_user_org_and_role(user["id"])  # type: ignore
        if not org_id:
            # Issue JWT with needs_org_setup flag
            jwt_token = create_jwt_token(
                {
                    "sub": str(user["id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "needs_org_setup": True,
                    "avatar_url": user_data["avatar_url"],
                }
            )
            redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
            return RedirectResponse(redirect_url)
        # Issue JWT with org context
        jwt_token = create_jwt_token(
            {
                "sub": str(user["id"]),
                "username": user["username"],
                "email": user["email"],
                "org_id": org_id,
                "role": role,
                "avatar_url": user_data["avatar_url"],
            }
        )
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        return RedirectResponse(redirect_url)


@router.post("/auth/set-cookie")
def set_jwt_cookie(data: dict[str, Any], response: Response) -> dict[str, str]:
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    # Set the cookie (httpOnly, secure, 1 hour expiry)
    response.set_cookie(
        key="jwt_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=3600,
        path="/",
    )
    return {"message": "JWT cookie set"}


@router.get("/me")
def get_me(jwt_token: Optional[str] = Cookie(None)) -> dict[str, Any]:
    logger.info("/me endpoint called")
    if jwt_token is None:
        logger.warning("No JWT token found in cookies")
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(jwt_token)
    if not payload:
        logger.warning("Invalid JWT token")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # If user has an org_id, validate they are still a member
    org_id = payload.get("org_id") if payload else None
    user_id = payload.get("sub") if payload else None
    logger.info(f"(auth/me): org_id={org_id}, user_id={user_id}")
    if org_id and user_id and payload is not None:
        is_member = org_service.is_user_in_org(org_id, user_id)
        logger.info(
            f"(auth/me): org_service.is_user_in_org({org_id}, {user_id}) -> {is_member}"
        )
        if not is_member:
            # User is no longer a member, update JWT to remove org context
            logger.info(
                f"User {user_id} is no longer a member of org {org_id}, updating JWT"
            )
            updated_payload = {
                "sub": user_id,
                "username": payload.get("username"),
                "email": payload.get("email"),
                "needs_org_setup": True,
            }
            # Return updated user info without org context
            return {
                "user": updated_payload,
                "org_id": None,
                "role": None,
                "needs_org_setup": True,
            }

    logger.info(f"Authenticated user: {payload}")
    return {
        "user": payload,
        "org_id": payload.get("org_id") if payload else None,
        "role": payload.get("role") if payload else None,
        "needs_org_setup": payload.get("needs_org_setup", False) if payload else False,
    }


@router.post("/auth/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key="jwt_token", path="/")
    logger.info("User logged out, JWT cookie cleared")
    return {"message": "Logged out"}


@router.delete("/auth/me")
def delete_own_account(response: Response, jwt_token: Optional[str] = Cookie(None)) -> dict[str, str]:
    if jwt_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = payload["sub"]
    try:
        delete_user_and_data(user_id)
        response.delete_cookie(key="jwt_token", path="/")
        return {"message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {e}")


@router.post("/auth/cleanup-users")
def cleanup_deleted_users(
    days_old: int = Query(30, description="Delete users older than N days"),
    jwt_token: Optional[str] = Cookie(None),
) -> dict[str, Any]:
    """Admin endpoint to clean up soft-deleted users (requires admin role)"""
    if jwt_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication")

    # Check if user is admin (you might want to add an admin flag to users table)
    # For now, we'll allow any authenticated user to trigger cleanup
    # In production, you'd want proper admin role checking

    from services.user import cleanup_deleted_users as cleanup_users

    deleted_count, message = cleanup_users(days_old)
    return {"message": message, "deleted_count": deleted_count, "days_old": days_old}


@router.get("/auth/validate-deletion")
def validate_account_deletion(jwt_token: Optional[str] = Cookie(None)) -> dict[str, Any]:
    """Validate what will happen when user deletes their account"""
    if jwt_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = payload["sub"]

    from services.user import validate_user_deletion_logic

    is_valid, message = validate_user_deletion_logic(user_id)

    return {"valid": is_valid, "message": message, "user_id": user_id}


@router.get("/github/validate-repo")
async def validate_github_repo(repo: str = Query(...), jwt_token: Optional[str] = Cookie(None)) -> dict[str, Any]:
    if jwt_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(jwt_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Fetch user's GitHub token from DB (assume get_user_by_id returns access_token)
    user = await get_user_by_id(payload["sub"])  # type: ignore
    access_token = user.get("access_token") if user else None
    if not access_token:
        raise HTTPException(status_code=403, detail="No GitHub token found")
    # Decrypt and log the token for debugging
    try:
        decrypted_token = decrypt_token(access_token)
    except Exception as e:
        logger.error(f"[DEBUG] Failed to decrypt token: {e}")
        raise HTTPException(status_code=500, detail="Failed to decrypt GitHub token")
    # Validate repo
    try:
        owner_repo = repo.split("/")
        if len(owner_repo) != 2:
            raise HTTPException(status_code=400, detail="Invalid repo format")
        owner, repo_name = owner_repo
        url = f"https://api.github.com/repos/{owner}/{repo_name}"
        headers = {
            "Authorization": f"token {decrypted_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        resp = httpx.get(url, headers=headers)
        if resp.status_code == 200:
            return {"status": "ok", "message": "Repository found"}
        elif resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        elif resp.status_code == 403:
            raise HTTPException(
                status_code=403, detail="Not authorized to access this repository"
            )
        elif resp.status_code == 401:
            logger.error("saad")
            raise HTTPException(
                status_code=403,
                detail="Your GitHub connection is invalid or expired. Please reconnect your GitHub account in User Settings.",
            )
        else:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {e}")
