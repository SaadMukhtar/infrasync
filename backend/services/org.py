import os
import uuid
import secrets
from config import (
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
    PLAN_LIMITS,
    STRIPE_PRICE_IDS,
    STRIPE_SECRET_KEY,
)
from supabase import create_client, Client
import logging
from typing import Tuple, Dict, Any, List, Optional
from fastapi import HTTPException
import stripe
import datetime

logger = logging.getLogger(__name__)


class OrgService:
    def __init__(self) -> None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.info(dict(os.environ))
            raise ValueError("Supabase environment variables not set")
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        stripe.api_key = STRIPE_SECRET_KEY

    def create_org(
        self, name: str, user_id: str, user_email: Optional[str] = None
    ) -> Tuple[Dict[str, Any], str]:
        if not name or len(name) < 2:
            return {}, "Organization name too short"
        org_id = str(uuid.uuid4())
        try:
            # Create organization (no invite_code)
            org_data = {"id": org_id, "name": name}
            org_result = self.supabase.table("organizations").insert(org_data).execute()

            if org_result.data:
                org_id = org_result.data[0]["id"]

                # Add user as admin
                member_data = {"org_id": org_id, "user_id": user_id, "role": "admin"}
                member_result = (
                    self.supabase.table("user_orgs").insert(member_data).execute()
                )

                # --- Stripe integration: create customer and free subscription ---
                stripe_customer_id = None
                stripe_subscription_id = None
                if user_email:
                    customer = stripe.Customer.create(
                        email=user_email, metadata={"org_id": org_id}
                    )
                    stripe_customer_id = customer.id
                    # Create free subscription
                    free_price_id = STRIPE_PRICE_IDS.get("free")
                    if free_price_id:
                        subscription = stripe.Subscription.create(
                            customer=stripe_customer_id,
                            items=[{"price": free_price_id}],
                            trial_period_days=0,
                        )
                        stripe_subscription_id = subscription.id
                # Update org with Stripe IDs
                update_fields: Dict[str, str | bool] = {}
                if stripe_customer_id:
                    update_fields["stripe_customer_id"] = stripe_customer_id
                if stripe_subscription_id:
                    update_fields["stripe_subscription_id"] = stripe_subscription_id
                    update_fields["plan"] = "free"
                    update_fields["billing_enabled"] = True
                if update_fields:
                    self.supabase.table("organizations").update(update_fields).eq(
                        "id", org_id
                    ).execute()

                if member_result.data:
                    return {"org_id": org_id, "name": name, "role": "admin"}, ""
                else:
                    return {}, "Failed to add user as admin"
            else:
                return {}, "Failed to create organization"
        except Exception as e:
            return {}, f"Error creating organization: {str(e)}"

    def join_org(self, invite_code: str, user_id: str) -> Tuple[Dict[str, Any], str]:
        if not invite_code:
            return {}, "Missing invite code"
        org_id = invite_code
        try:
            org_resp = (
                self.supabase.table("organizations")
                .select("id, name")
                .eq("id", org_id)
                .single()
                .execute()
            )
            if not org_resp.data:
                return {}, "Invalid invite code or org not found"
            # Check if user is already an active member
            member_result = (
                self.supabase.table("user_orgs")
                .select("*")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .eq("deleted", False)
                .execute()
            )
            if member_result.data:
                return {}, "User is already a member of this organization"
            # Check if user has a soft-deleted membership
            deleted_result = (
                self.supabase.table("user_orgs")
                .select("*")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .eq("deleted", True)
                .maybe_single()
                .execute()
            )
            if deleted_result.data:
                # Undelete the membership
                self.supabase.table("user_orgs").update(
                    {"deleted": False, "deleted_at": None, "role": "viewer"}
                ).eq("org_id", org_id).eq("user_id", user_id).execute()
                return {
                    "org_id": org_id,
                    "name": org_resp.data["name"],
                    "role": "viewer",
                }, ""
            # Otherwise, insert a new membership
            self.supabase.table("user_orgs").insert(
                {"user_id": user_id, "org_id": org_id, "role": "viewer"}
            ).execute()
            return {
                "org_id": org_id,
                "name": org_resp.data["name"],
                "role": "viewer",
            }, ""
        except Exception as e:
            return {}, f"Failed to join organization: {str(e)}"

    def get_org_info(
        self, org_id: str, user_id: Optional[str] = None
    ) -> Tuple[Dict[str, Any], str]:
        if not org_id:
            return {}, "Missing org_id"
        try:
            # If user_id is provided, validate membership
            if user_id is not None and user_id != "":
                is_member = self.is_user_in_org(org_id, user_id)
                if not is_member:
                    return {}, "You are no longer a member of this organization"
            # Include created_at in the select and filter out deleted orgs
            result = (
                self.supabase.table("organizations")
                .select("id, name, created_at")
                .eq("id", org_id)
                .eq("deleted", False)
                .execute()
            )
            if result.data:
                org = result.data[0]
                return {
                    "id": org["id"],
                    "name": org["name"],
                    "created_at": org["created_at"],
                }, ""
            else:
                return {}, "Organization not found"
        except Exception as e:
            return {}, f"Error fetching organization: {str(e)}"

    def get_org_members(self, org_id: str) -> Tuple[List[Dict[str, Any]], str]:
        if not org_id:
            logger.error("Missing org_id")
            return [], "Missing org_id"
        try:
            # Log the query being sent
            logger.info(f"Querying user_orgs for org_id={org_id} with join to users")
            # Use explicit join syntax to avoid ambiguity and filter out deleted records
            result = (
                self.supabase.table("user_orgs")
                .select("user_id, role, users:user_id(username, email)")
                .eq("org_id", org_id)
                .eq("deleted", False)
                .execute()
            )
            logger.info(
                f"Supabase response status: {getattr(result, 'status_code', 'unknown')}"
            )
            logger.info(f"Supabase raw data: {result.data}")
            logger.info(f"Supabase error: {getattr(result, 'error', None)}")

            if result.data:
                members = []
                for member in result.data:
                    logger.info(f"Processing member row: {member}")
                    members.append(
                        {
                            "user_id": member["user_id"],
                            "username": member["users"]["username"],
                            "email": member["users"]["email"],
                            "role": member["role"],
                        }
                    )
                return members, ""
            else:
                logger.warning("No members found for org_id=%s", org_id)
                return [], "No members found"
        except Exception as e:
            logger.error(f"Error fetching members: {str(e)}")
            return [], f"Error fetching members: {str(e)}"

    def invite_member(
        self, org_id: str, email: str, role: str
    ) -> Tuple[Dict[str, Any], str]:
        try:
            # Check if user exists (exclude deleted users)
            user_result = (
                self.supabase.table("users")
                .select("id")
                .eq("email", email)
                .eq("deleted", False)
                .execute()
            )

            if not user_result.data:
                return {}, "User not found"

            user_id = user_result.data[0]["id"]

            # Check if user is already a member
            member_result = (
                self.supabase.table("user_orgs")
                .select("*")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .execute()
            )

            if member_result.data:
                return {}, "User is already a member of this organization"

            # Add user as member
            member_data = {"org_id": org_id, "user_id": user_id, "role": role}
            member_result = (
                self.supabase.table("user_orgs").insert(member_data).execute()
            )
            if member_result.data:
                return {"message": "Member invited successfully"}, ""
            else:
                return {}, "Failed to invite member"
        except Exception as e:
            return {}, f"Error inviting member: {str(e)}"

    def update_member_role(
        self, org_id: str, user_id: str, role: str
    ) -> Tuple[Dict[str, Any], str]:
        try:
            member_result = (
                self.supabase.table("user_orgs")
                .select("*")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not member_result.data:
                return {}, "Member not found"

            # Update role
            update_result = (
                self.supabase.table("user_orgs")
                .update({"role": role})
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .execute()
            )
            if update_result.data:
                return {"message": "Role updated successfully"}, ""
            else:
                return {}, "Failed to update role"
        except Exception as e:
            return {}, f"Error updating role: {str(e)}"

    def remove_member(self, org_id: str, user_id: str) -> Tuple[Dict[str, Any], str]:
        try:
            member_result = (
                self.supabase.table("user_orgs")
                .select("*")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not member_result.data:
                return {}, "Member not found"

            # Remove member
            update_result = (
                self.supabase.table("user_orgs")
                .update({"deleted": True, "deleted_at": datetime.datetime.utcnow()})
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .execute()
            )
            if update_result.data:
                return {"message": "Member removed successfully"}, ""
            else:
                return {}, "Failed to remove member"
        except Exception as e:
            return {}, f"Error removing member: {str(e)}"

    def update_org_name(self, org_id: str, name: str) -> Tuple[Dict[str, Any], str]:
        if not org_id:
            return {}, "Missing org_id"
        if not name or len(name) < 2:
            return {}, "Organization name too short"
        try:
            result = (
                self.supabase.table("organizations")
                .update({"name": name})
                .eq("id", org_id)
                .execute()
            )
            if result.data:
                return {"id": org_id, "name": name}, ""
            else:
                return {}, "Failed to update organization name"
        except Exception as e:
            return {}, f"Error updating organization: {str(e)}"

    def is_user_in_org(self, org_id: str, user_id: str) -> bool:
        """Check if a user is still a member of the organization and the org is not deleted"""
        try:
            # Check user_orgs (not deleted)
            result = (
                self.supabase.table("user_orgs")
                .select("user_id")
                .eq("org_id", org_id)
                .eq("user_id", user_id)
                .eq("deleted", False)
                .execute()
            )
            if not result.data:
                return False
            # Check organizations (not deleted)
            org_result = (
                self.supabase.table("organizations")
                .select("id")
                .eq("id", org_id)
                .eq("deleted", False)
                .execute()
            )
            if not org_result.data:
                return False
            return True
        except Exception as e:
            logger.error(f"Error checking user membership: {str(e)}")
            return False

    def is_webhook_used_by_other_org(self, webhook_url: str, org_id: str) -> bool:
        # Check if this webhook is used by any monitor in a different (active) org
        monitors = (
            self.supabase.table("monitors")
            .select("org_id")
            .eq("webhook_url", webhook_url)
            .eq("deleted", False)
            .execute()
        )
        if not monitors.data:
            return False
        # Get all org_ids using this webhook (excluding deleted orgs)
        org_ids = [
            m["org_id"]
            for m in monitors.data
            if m.get("org_id") and m["org_id"] != org_id
        ]
        if not org_ids:
            return False
        # Check if any of these orgs are not deleted
        orgs = (
            self.supabase.table("organizations")
            .select("id")
            .in_("id", org_ids)
            .eq("deleted", False)
            .execute()
        )
        return bool(orgs.data)

    def _generate_invite_code(self) -> str:
        return secrets.token_urlsafe(16)

    def disband_org(self, org_id: str) -> Tuple[Dict[str, Any], str]:
        """Delete organization with proper Stripe cleanup and data retention"""
        try:
            # 1. Get org info first to check for Stripe data
            org_result = (
                self.supabase.table("organizations")
                .select("*")
                .eq("id", org_id)
                .single()
                .execute()
            )
            if not org_result.data:
                return {}, "Organization not found"

            org_data = org_result.data
            stripe_customer_id = org_data.get("stripe_customer_id")
            stripe_subscription_id = org_data.get("stripe_subscription_id")

            # 2. Cancel Stripe subscription if exists
            if stripe_subscription_id:
                try:
                    subscription = stripe.Subscription.retrieve(stripe_subscription_id)
                    if subscription.status in ["active", "trialing"]:
                        stripe.Subscription.delete(stripe_subscription_id)
                        print(
                            f"Cancelled Stripe subscription {stripe_subscription_id} for org {org_id}"
                        )
                except Exception as e:
                    print(f"Error cancelling Stripe subscription: {e}")
                    # Continue with deletion even if Stripe fails

            # 3. Delete Stripe customer if exists
            if stripe_customer_id:
                try:
                    stripe.Customer.delete(stripe_customer_id)
                    print(
                        f"Deleted Stripe customer {stripe_customer_id} for org {org_id}"
                    )
                except Exception as e:
                    print(f"Error deleting Stripe customer: {e}")
                    # Continue with deletion even if Stripe fails

            # 4. Soft delete org data (mark as deleted, keep for 30 days)
            current_time = datetime.datetime.utcnow().isoformat()
            soft_delete_data = {
                "deleted_at": current_time,
                "deleted": True,
                "stripe_customer_id": None,
                "stripe_subscription_id": None,
                "plan": "free",
                "billing_enabled": False,
            }

            # Update org with deletion timestamp
            self.supabase.table("organizations").update(soft_delete_data).eq(
                "id", org_id
            ).execute()

            # 5. Soft delete related data
            # Mark monitors as deleted
            self.supabase.table("monitors").update(
                {"deleted_at": current_time, "deleted": True}
            ).eq("org_id", org_id).execute()

            # Mark user_orgs as deleted
            self.supabase.table("user_orgs").update(
                {"deleted_at": current_time, "deleted": True}
            ).eq("org_id", org_id).execute()

            # Keep audit logs for compliance (don't delete)

            print(f"Soft deleted org {org_id} and related data")

            return {
                "message": "Organization disbanded successfully",
                "org_id": org_id,
                "deleted_at": current_time,
            }, ""

        except Exception as e:
            print(f"Error disbanding org {org_id}: {e}")
            return {}, f"Failed to disband organization: {e}"

    def enforce_plan_limits(
        self, org: Dict[str, Any], resource_type: str, current_count: int
    ) -> None:
        """Raise HTTPException if org exceeds plan limits for resource_type ('repo' or 'channel')."""
        if org.get("is_internal"):
            return
        plan = org.get("plan", "free")
        limits = PLAN_LIMITS[plan]
        if resource_type == "repo" and current_count >= limits["max_repos"]:
            raise HTTPException(
                403,
                f"Your plan allows up to {limits['max_repos']} repositories. Upgrade to add more.",
            )
        if resource_type == "channel" and current_count >= limits["max_channels"]:
            raise HTTPException(
                403,
                f"Your plan allows up to {limits['max_channels']} delivery channels. Upgrade to add more.",
            )

    def cleanup_deleted_orgs(self, days_old: int = 30) -> Tuple[int, str]:
        """Permanently delete orgs and related data that were soft-deleted more than N days ago"""
        try:
            from datetime import datetime, timedelta

            cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()

            # Find orgs to permanently delete
            orgs_to_delete = (
                self.supabase.table("organizations")
                .select("id")
                .eq("deleted", True)
                .lt("deleted_at", cutoff_date)
                .execute()
            )

            if not orgs_to_delete.data:
                return 0, "No orgs to clean up"

            deleted_count = 0
            for org in orgs_to_delete.data:
                org_id = org["id"]

                # Permanently delete related data
                self.supabase.table("monitors").delete().eq("org_id", org_id).execute()
                self.supabase.table("user_orgs").delete().eq("org_id", org_id).execute()

                # Keep audit logs for longer (90 days for compliance)
                audit_cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()
                self.supabase.table("audit_logs").delete().eq("org_id", org_id).lt(
                    "created_at", audit_cutoff
                ).execute()

                # Finally delete the org
                self.supabase.table("organizations").delete().eq("id", org_id).execute()

                deleted_count += 1
                print(f"Permanently deleted org {org_id} and related data")

            return (
                deleted_count,
                f"Successfully cleaned up {deleted_count} deleted orgs",
            )

        except Exception as e:
            print(f"Error cleaning up deleted orgs: {e}")
            return 0, f"Error during cleanup: {e}"
