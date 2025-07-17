# backend/services/user.py
import os
from supabase import create_client
from cryptography.fernet import Fernet
import base64
import datetime
from typing import Tuple

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

FERNET_KEY = os.environ.get("FERNET_KEY")
fernet = Fernet(FERNET_KEY) if FERNET_KEY else None

def encrypt_token(token: str) -> str:
    if not fernet:
        raise Exception("FERNET_KEY not set in environment")
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(token_enc: str) -> str:
    if not fernet:
        raise Exception("FERNET_KEY not set in environment")
    return fernet.decrypt(token_enc.encode()).decode()

async def get_or_create_user(github_id, username, email, access_token):
    # Encrypt the access token for storage
    encrypted_token = encrypt_token(access_token)
    
    # First, try to find active user (exclude deleted users)
    resp = supabase.table("users").select("*").eq("github_id", github_id).eq("deleted", False).execute()
    if resp.data and len(resp.data) > 0:
        # Update existing active user
        user = resp.data[0]
        supabase.table("users").update({
            "username": username,
            "email": email,
            "access_token": encrypted_token
        }).eq("github_id", github_id).execute()
        user.update({"username": username, "email": email, "access_token": encrypted_token})
        return user
    
    # If no active user found, check if there's a deleted user with this github_id
    deleted_resp = supabase.table("users").select("*").eq("github_id", github_id).eq("deleted", True).execute()
    if deleted_resp.data and len(deleted_resp.data) > 0:
        # Reactivate the deleted user
        user = deleted_resp.data[0]
        current_time = datetime.datetime.utcnow().isoformat()
        supabase.table("users").update({
            "username": username,
            "email": email,
            "access_token": encrypted_token,
            "deleted": False,
            "deleted_at": None
        }).eq("github_id", github_id).execute()
        user.update({
            "username": username, 
            "email": email, 
            "access_token": encrypted_token,
            "deleted": False,
            "deleted_at": None
        })
        print(f"Reactivated deleted user {user['id']} with github_id {github_id}")
        return user
    
    # If no user exists at all, create a new one
    insert_resp = supabase.table("users").insert({
        "github_id": github_id,
        "username": username,
        "email": email,
        "access_token": encrypted_token
    }).execute()
    return insert_resp.data[0] if insert_resp.data else None

async def get_user_org_and_role(user_id):
    # Return the first org the user belongs to, only if both user_orgs and org are not deleted
    resp = supabase.table("user_orgs") \
        .select("org_id,role,organizations!inner(id,deleted)") \
        .eq("user_id", user_id) \
        .eq("deleted", False) \
        .eq("organizations.deleted", False) \
        .limit(1) \
        .execute()
    if resp.data and len(resp.data) > 0:
        return resp.data[0]["org_id"], resp.data[0]["role"]
    return None, None

async def get_user_github_token(user_id):
    resp = supabase.table("users").select("access_token").eq("id", user_id).eq("deleted", False).maybe_single().execute()
    if resp.data and resp.data.get("access_token"):
        try:
            return decrypt_token(resp.data["access_token"])
        except Exception:
            return None
    return None

def delete_user_and_data(user_id: str):
    """Delete user with proper cleanup of org memberships and data"""
    try:
        # 1. Get user info first
        user_result = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not user_result.data:
            print(f"User {user_id} not found for deletion")
            return

        user_data = user_result.data
        print(f"Starting deletion process for user {user_id} ({user_data.get('email', 'no email')})")

        # 2. Get all org memberships for this user
        memberships = supabase.table("user_orgs").select("org_id, role").eq("user_id", user_id).eq("deleted", False).execute()

        if not memberships.data:
            print(f"User {user_id} has no active org memberships")
        else:
            print(f"User {user_id} has {len(memberships.data)} active org memberships")

        # 3. Handle each org membership
        for membership in memberships.data or []:
            org_id = membership["org_id"]
            role = membership["role"]

            print(f"Processing membership: org_id={org_id}, role={role}")

            # Check if user is the only admin in the org
            if role == "admin":
                # Count all active admins in this org (excluding the user being deleted)
                admin_count = supabase.table("user_orgs").select("user_id", count="exact").eq("org_id", org_id).eq("role", "admin").eq("deleted", False).neq("user_id", user_id).execute()

                print(f"Found {admin_count.count} other admins in org {org_id}")

                if admin_count.count == 0:
                    # User is the only admin - need to handle org deletion
                    print(f"User {user_id} is the only admin of org {org_id}, will delete org")
                    # Import here to avoid circular imports
                    from services.org import OrgService
                    org_service = OrgService()
                    result, error = org_service.disband_org(org_id)
                    if error:
                        print(f"Error disbanding org {org_id}: {error}")
                        raise Exception(f"Failed to disband org {org_id}: {error}")
                    print(f"Successfully disbanded org {org_id}")
                else:
                    # Remove user from org (other admins exist)
                    print(f"Removing admin user {user_id} from org {org_id} (other admins exist)")
                    supabase.table("user_orgs").update({
                        "deleted": True,
                        "deleted_at": datetime.datetime.utcnow().isoformat()
                    }).eq("org_id", org_id).eq("user_id", user_id).execute()
            else:
                # User is not admin, just remove from org
                print(f"Removing non-admin user {user_id} from org {org_id}")
                supabase.table("user_orgs").update({
                    "deleted": True,
                    "deleted_at": datetime.datetime.utcnow().isoformat()
                }).eq("org_id", org_id).eq("user_id", user_id).execute()

        # 4. Soft delete user data (keep for audit purposes)
        current_time = datetime.datetime.utcnow().isoformat()
        supabase.table("users").update({
            "deleted": True,
            "deleted_at": current_time,
            "email": f"deleted_{user_id}@deleted.user",
            "username": f"deleted_{user_id}",
            "access_token": None
        }).eq("id", user_id).execute()

        print(f"Successfully soft deleted user {user_id} and cleaned up memberships")

    except Exception as e:
        print(f"Error deleting user {user_id}: {e}")
        raise e

async def get_user_by_id(user_id):
    resp = supabase.table("users").select("*").eq("id", user_id).eq("deleted", False).maybe_single().execute()
    if resp.data:
        return resp.data
    return None

def cleanup_deleted_users(days_old: int = 30) -> Tuple[int, str]:
    """Permanently delete users that were soft-deleted more than N days ago"""
    try:
        from datetime import datetime, timedelta

        cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()

        # Find users to permanently delete
        users_to_delete = supabase.table("users").select("id").eq("deleted", True).lt("deleted_at", cutoff_date).execute()

        if not users_to_delete.data:
            return 0, "No users to clean up"

        deleted_count = 0
        for user in users_to_delete.data:
            user_id = user["id"]

            # Permanently delete user
            supabase.table("users").delete().eq("id", user_id).execute()

            deleted_count += 1
            print(f"Permanently deleted user {user_id}")

        return deleted_count, f"Successfully cleaned up {deleted_count} deleted users"

    except Exception as e:
        print(f"Error cleaning up deleted users: {e}")
        return 0, f"Error during cleanup: {e}"

def validate_user_deletion_logic(user_id: str) -> Tuple[bool, str]:
    """Validate that user deletion logic will work correctly for a given user"""
    try:
        # Get user's org memberships
        memberships = supabase.table("user_orgs").select("org_id, role").eq("user_id", user_id).eq("deleted", False).execute()

        if not memberships.data:
            return True, "User has no org memberships - safe to delete"

        validation_results = []

        for membership in memberships.data:
            org_id = membership["org_id"]
            role = membership["role"]

            if role == "admin":
                # Check if user is the only admin
                admin_count = supabase.table("user_orgs").select("user_id", count="exact").eq("org_id", org_id).eq("role", "admin").eq("deleted", False).neq("user_id", user_id).execute()

                if admin_count.count == 0:
                    validation_results.append(f"WARNING: User is only admin of org {org_id} - org will be deleted")
                else:
                    validation_results.append(f"OK: User is admin of org {org_id} but {admin_count.count} other admins exist")
            else:
                validation_results.append(f"OK: User is {role} in org {org_id} - safe to remove")

        return True, "; ".join(validation_results)

    except Exception as e:
        return False, f"Validation error: {e}" 