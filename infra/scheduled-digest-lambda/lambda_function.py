import os
import httpx
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BACKEND_DIGEST_ENDPOINT = os.getenv("BACKEND_DIGEST_ENDPOINT")  # Your FastAPI endpoint


async def fetch_monitors():
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/monitors", headers=headers, params={"select": "*"}
        )
        response.raise_for_status()
        return response.json()


async def trigger_digests(monitors):
    async with httpx.AsyncClient() as client:
        for monitor in monitors:
            if monitor["frequency"] not in ("daily", "weekly"):
                continue

            payload = {
                "repo": monitor["repo"],
                "delivery_method": monitor["delivery_method"],
                "webhook_url": monitor["webhook_url"],
                "frequency": monitor["frequency"],
            }

            print(f"Sending digest for {monitor['repo']}")
            try:
                resp = await client.post(
                    BACKEND_DIGEST_ENDPOINT, json=payload, timeout=30
                )
                print(f"{resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"Error sending digest for {monitor['repo']}: {str(e)}")


def lambda_handler(event, context):
    import asyncio

    print(f"Digest Lambda triggered at {datetime.utcnow().isoformat()}Z")
    asyncio.run(run())


async def run():
    monitors = await fetch_monitors()
    await trigger_digests(monitors)
