from fastapi import APIRouter, Depends, HTTPException, Request, Cookie, Body
from config import (
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_IDS,
    FRONTEND_URL,
    PLAN_LIMITS,
)
import stripe
from services.org import OrgService
from utils.jwt import verify_jwt_token
from typing import Any
import os

stripe.api_key = STRIPE_SECRET_KEY
router = APIRouter(prefix="/billing", tags=["billing"])
org_service = OrgService()

# --- Stripe price ID to plan mapping ---
STRIPE_PRICE_ID_TO_PLAN = {
    os.getenv("STRIPE_PRICE_ID_PRO"): "pro",
    os.getenv("STRIPE_PRICE_ID_TEAM"): "team",
}


# --- Dependencies ---
def get_jwt_payload(jwt_token: str = Cookie(None)) -> dict[str, Any]:
    payload = verify_jwt_token(jwt_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return payload


def require_org_admin(payload: dict[str, Any] = Depends(get_jwt_payload)) -> dict[str, Any]:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


def require_org_member(payload: dict[str, Any] = Depends(get_jwt_payload)) -> dict[str, Any]:
    if not payload.get("org_id"):
        raise HTTPException(status_code=401, detail="No org context")
    return payload


async def get_org_by_id(org_id: str) -> dict[str, Any]:
    # Fetch org from Supabase by org_id
    result, error = org_service.get_org_info(org_id)
    if error or not result:
        raise HTTPException(status_code=404, detail=error or "Org not found")
    # Fetch billing fields and filter out deleted orgs
    org_data = (
        org_service.supabase.table("organizations")
        .select("*", count="exact")
        .eq("id", org_id)
        .eq("deleted", False)
        .single()
        .execute()
    )
    if not org_data.data:
        raise HTTPException(status_code=404, detail="Org not found")
    org = org_data.data
    # Add monitor count for enforcement (only non-deleted monitors)
    monitor_count = (
        org_service.supabase.table("monitors")
        .select("id", count="exact")
        .eq("org_id", org_id)
        .eq("deleted", False)
        .execute()
        .count
        or 0
    )
    org["monitor_count"] = monitor_count
    return org


async def update_org_billing(org_id: str, **fields: Any) -> Any:
    # Update org billing fields in Supabase
    update = (
        org_service.supabase.table("organizations")
        .update(fields)
        .eq("id", org_id)
        .execute()
    )
    if update.error:
        raise HTTPException(
            status_code=500, detail=f"Failed to update billing: {update.error}"
        )
    return update.data


# --- Helper: Parse plan from Stripe subscription ---
def get_plan_from_subscription(subscription: dict[str, Any]) -> str:
    # Stripe subscription object: subscription["items"]["data"] is a list of items
    for item in subscription["items"]["data"]:
        price_id = item["price"]["id"]
        if price_id in STRIPE_PRICE_ID_TO_PLAN:
            return STRIPE_PRICE_ID_TO_PLAN[price_id]
    return "free"


# --- Endpoints ---


@router.post("/upgrade-subscription")
async def upgrade_subscription(
    org_id: str = Body(...), plan: str = Body(...), payload: dict[str, Any] = Depends(require_org_admin)
) -> dict[str, str]:
    org = await get_org_by_id(org_id)
    if org.get("is_internal"):
        raise HTTPException(403, "Internal orgs are free")
    if plan not in STRIPE_PRICE_IDS:
        raise HTTPException(400, "Invalid plan")
    # If org has a subscription, update it
    if org.get("stripe_subscription_id"):
        try:
            subscription = stripe.Subscription.retrieve(org["stripe_subscription_id"])
            # Update the subscription to the new price
            price_id = STRIPE_PRICE_IDS[plan]
            if price_id is None:
                raise HTTPException(400, "Invalid Stripe price ID for plan")
            stripe.Subscription.modify(
                subscription.id,
                cancel_at_period_end=False,
                proration_behavior="create_prorations",
                items=[
                    {
                        "id": subscription["items"]["data"][0].id,
                        "price": price_id,
                    }
                ],
            )
            await update_org_billing(org_id, plan=plan, billing_enabled=True)
            return {"message": f"Subscription updated to {plan}"}
        except Exception as e:
            raise HTTPException(500, f"Failed to update subscription: {e}")
    # If no subscription, create one
    else:
        try:
            customer_id = org.get("stripe_customer_id")
            if not customer_id:
                customer = stripe.Customer.create(
                    email=payload["email"], metadata={"org_id": org_id}
                )
                customer_id = customer.id
                await update_org_billing(org_id, stripe_customer_id=customer_id)
            price_id = STRIPE_PRICE_IDS[plan]
            if price_id is None:
                raise HTTPException(400, "Invalid Stripe price ID for plan")
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                trial_period_days=0,
            )
            await update_org_billing(
                org_id,
                plan=plan,
                billing_enabled=True,
                stripe_subscription_id=subscription.id,
            )
            return {"message": f"Subscription created and set to {plan}"}
        except Exception as e:
            raise HTTPException(500, f"Failed to create subscription: {e}")


# Update create-checkout-session to block if already subscribed
@router.post("/create-checkout-session")
async def create_checkout_session(
    org_id: str, plan: str, payload=Depends(require_org_admin)
):
    org = await get_org_by_id(org_id)
    if org.get("is_internal"):
        raise HTTPException(403, "Internal orgs are free")
    if plan not in STRIPE_PRICE_IDS:
        raise HTTPException(400, "Invalid plan")
    if org.get("stripe_subscription_id"):
        raise HTTPException(
            400,
            "Org already has a subscription. Use the upgrade endpoint or Stripe portal.",
        )
    # Create Stripe customer if needed
    if not org.get("stripe_customer_id"):
        customer = stripe.Customer.create(
            email=payload["email"], metadata={"org_id": org_id}
        )
        await update_org_billing(org_id, stripe_customer_id=customer.id)
    else:
        customer = stripe.Customer.retrieve(org["stripe_customer_id"])

    # Create checkout session
    price_id = STRIPE_PRICE_IDS[plan]
    if price_id is None:
        raise HTTPException(400, "Invalid Stripe price ID for plan")
    session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{FRONTEND_URL}/billing?billing=success",
        cancel_url=f"{FRONTEND_URL}/billing?billing=cancel",
    )

    # Immediately update the org's plan to the new plan
    # This ensures the UI shows the correct plan even if webhooks fail
    await update_org_billing(org_id, plan=plan, billing_enabled=True)

    return {"url": session.url}


# Update portal session to always redirect to /billing
@router.post("/create-portal-session")
async def create_portal_session(org_id: str, payload: dict[str, Any] = Depends(require_org_admin)) -> dict[str, str]:
    org = await get_org_by_id(org_id)
    if not org.get("stripe_customer_id"):
        raise HTTPException(400, "No Stripe customer for org")
    session = stripe.billing_portal.Session.create(
        customer=org["stripe_customer_id"],
        return_url=f"{FRONTEND_URL}/billing?billing=portal_return",
    )
    return {"url": session.url}


# Webhook: always update org plan to match active subscription
@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict[str, str]:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    print(
        f"Webhook received: {request.headers.get('stripe-signature', 'No signature')}"
    )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )  # type: ignore
        print(f"Webhook event type: {event['type']}")
    except Exception as e:
        print(f"Webhook signature verification failed: {e}")
        raise HTTPException(400, "Invalid webhook")

    if event["type"] == "checkout.session.completed":
        print("Processing checkout.session.completed")
        session = event["data"]["object"]
        customer_id = session["customer"]
        print(f"Customer ID: {customer_id}")
        orgs = (
            org_service.supabase.table("organizations")
            .select("id")
            .eq("stripe_customer_id", customer_id)
            .eq("deleted", False)
            .execute()
        )
        if orgs.data and len(orgs.data) > 0:
            org_id = orgs.data[0]["id"]
            print(f"Found org ID: {org_id}")
            subscription_id = session.get("subscription")
            if subscription_id:
                subscription = stripe.Subscription.retrieve(subscription_id)
                price_id = subscription["items"]["data"][0]["price"]["id"]
                plan = next(
                    (k for k, v in STRIPE_PRICE_IDS.items() if v == price_id), "free"
                )
                print(f"Updating org {org_id} to plan {plan}")
                await update_org_billing(
                    org_id,
                    plan=plan,
                    billing_enabled=True,
                    stripe_subscription_id=subscription_id,
                )
                print(f"Successfully updated org {org_id} to plan {plan}")

    elif event["type"] == "customer.subscription.updated":
        print("Processing customer.subscription.updated")
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        print(f"Customer ID: {customer_id}")
        orgs = (
            org_service.supabase.table("organizations")
            .select("id")
            .eq("stripe_customer_id", customer_id)
            .eq("deleted", False)
            .execute()
        )
        if orgs.data and len(orgs.data) > 0:
            org_id = orgs.data[0]["id"]
            print(f"Found org ID: {org_id}")
            price_id = subscription["items"]["data"][0]["price"]["id"]
            plan = next(
                (k for k, v in STRIPE_PRICE_IDS.items() if v == price_id), "free"
            )
            print(f"Updating org {org_id} to plan {plan}")
            await update_org_billing(
                org_id,
                plan=plan,
                billing_enabled=True,
                stripe_subscription_id=subscription["id"],
            )
            print(f"Successfully updated org {org_id} to plan {plan}")

    elif event["type"] == "customer.subscription.deleted":
        print("Processing customer.subscription.deleted")
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        print(f"Customer ID: {customer_id}")
        orgs = (
            org_service.supabase.table("organizations")
            .select("id")
            .eq("stripe_customer_id", customer_id)
            .eq("deleted", False)
            .execute()
        )
        if orgs.data and len(orgs.data) > 0:
            org_id = orgs.data[0]["id"]
            print(f"Found org ID: {org_id}")
            await update_org_billing(
                org_id, plan="free", billing_enabled=False, stripe_subscription_id=None
            )
            print(f"Successfully updated org {org_id} to free plan")

    return {"status": "ok"}


@router.get("/status")
async def billing_status(org_id: str, payload: dict[str, Any] = Depends(require_org_member)) -> dict[str, Any]:
    org = await get_org_by_id(org_id)
    return {
        "plan": org["plan"],
        "billing_enabled": org["billing_enabled"],
        "limits": PLAN_LIMITS[org["plan"]],
        "stripe_customer_id": org.get("stripe_customer_id"),
        "stripe_subscription_id": org.get("stripe_subscription_id"),
        "is_internal": org.get("is_internal"),
    }


@router.post("/refresh")
async def refresh_billing_status(org_id: str, payload: dict[str, Any] = Depends(require_org_member)) -> dict[str, Any]:
    """Manually refresh billing status by syncing with Stripe"""
    org = await get_org_by_id(org_id)

    if not org.get("stripe_customer_id"):
        return {"message": "No Stripe customer found for org"}

    try:
        # Get customer's active subscriptions
        customer = stripe.Customer.retrieve(org["stripe_customer_id"])
        subscriptions = stripe.Subscription.list(customer=customer.id, status="active")

        if subscriptions.data:
            # Get the first active subscription
            subscription = subscriptions.data[0]
            price_id = subscription["items"]["data"][0]["price"]["id"]
            plan = next(
                (k for k, v in STRIPE_PRICE_IDS.items() if v == price_id), "free"
            )

            await update_org_billing(
                org_id,
                plan=plan,
                billing_enabled=True,
                stripe_subscription_id=subscription.id,
            )

            return {
                "message": f"Billing status refreshed. Plan updated to {plan}",
                "plan": plan,
                "billing_enabled": True,
            }
        else:
            # No active subscriptions, set to free
            await update_org_billing(
                org_id, plan="free", billing_enabled=False, stripe_subscription_id=None
            )

            return {
                "message": "Billing status refreshed. Plan set to free",
                "plan": "free",
                "billing_enabled": False,
            }

    except Exception as e:
        print(f"Error refreshing billing status: {e}")
        raise HTTPException(500, f"Failed to refresh billing status: {e}")
