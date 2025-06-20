import os
import httpx
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BACKEND_DIGEST_ENDPOINT = os.getenv("BACKEND_DIGEST_ENDPOINT")

# Compliance: 30 days retention for deleted monitors
RETENTION_DAYS = 30


async def fetch_active_monitors():
    """Fetch only non-deleted monitors that should receive digests"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/monitors",
            headers=headers,
            params={"select": "*", "deleted": "eq.false"},  # Only non-deleted monitors
        )
        response.raise_for_status()
        monitors = response.json()
        logger.info(f"Found {len(monitors)} active monitors for digest processing")
        return monitors


async def cleanup_deleted_monitors():
    """Permanently delete monitors that have been soft-deleted for over 30 days"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    # Calculate cutoff date (30 days ago)
    cutoff_date = (datetime.utcnow() - timedelta(days=RETENTION_DAYS)).isoformat()

    async with httpx.AsyncClient() as client:
        # First, get the IDs of monitors to permanently delete
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/monitors",
            headers=headers,
            params={
                "select": "id,repo,deleted_at",
                "deleted": "eq.true",
                "deleted_at": f"lt.{cutoff_date}",
            },
        )
        response.raise_for_status()
        monitors_to_delete = response.json()

        if not monitors_to_delete:
            logger.info("No deleted monitors to permanently remove")
            return 0

        logger.info(
            f"Found {len(monitors_to_delete)} deleted monitors to permanently remove"
        )

        # Log which repos are being permanently deleted (for audit purposes)
        for monitor in monitors_to_delete:
            deleted_at = monitor.get("deleted_at", "unknown")
            logger.info(
                f"Permanently deleting monitor for repo {monitor.get('repo', 'unknown')} (deleted at {deleted_at})"
            )

        # Permanently delete the monitors
        delete_response = await client.delete(
            f"{SUPABASE_URL}/rest/v1/monitors",
            headers=headers,
            params={"deleted": "eq.true", "deleted_at": f"lt.{cutoff_date}"},
        )
        delete_response.raise_for_status()

        logger.info(
            f"Successfully permanently deleted {len(monitors_to_delete)} monitors"
        )
        return len(monitors_to_delete)


async def trigger_digests(monitors):
    """Trigger digest generation for active monitors"""
    async with httpx.AsyncClient() as client:
        successful_digests = 0
        failed_digests = 0

        for monitor in monitors:
            if monitor["frequency"] not in ("daily", "weekly"):
                logger.debug(
                    f"Skipping monitor {monitor.get('repo', 'unknown')} - frequency {monitor.get('frequency', 'unknown')} not scheduled"
                )
                continue

            payload = {
                "repo": monitor["repo"],
                "delivery_method": monitor["delivery_method"],
                "webhook_url": monitor["webhook_url"],
                "frequency": monitor["frequency"],
            }

            logger.info(
                f"Triggering digest for repo: {monitor['repo']} (delivery: {monitor['delivery_method']})"
            )
            try:
                resp = await client.post(
                    BACKEND_DIGEST_ENDPOINT, json=payload, timeout=30
                )
                if resp.status_code == 200:
                    logger.info(f"Successfully triggered digest for {monitor['repo']}")
                    successful_digests += 1
                else:
                    logger.error(
                        f"Failed to trigger digest for {monitor['repo']} - Status: {resp.status_code}"
                    )
                    failed_digests += 1
            except Exception as e:
                logger.error(f"Error triggering digest for {monitor['repo']}: {str(e)}")
                failed_digests += 1

        logger.info(
            f"Digest processing complete - Success: {successful_digests}, Failed: {failed_digests}"
        )


def lambda_handler(event, context):
    import asyncio

    logger.info(f"Digest Lambda triggered at {datetime.utcnow().isoformat()}Z")
    asyncio.run(run())


async def run():
    """Main execution function"""
    try:
        # Step 1: Clean up old deleted monitors
        deleted_count = await cleanup_deleted_monitors()
        logger.info(f"Cleanup completed - removed {deleted_count} old deleted monitors")

        # Step 2: Fetch active monitors
        monitors = await fetch_active_monitors()

        # Step 3: Trigger digests for active monitors
        await trigger_digests(monitors)

        logger.info("Lambda execution completed successfully")

    except Exception as e:
        logger.error(f"Lambda execution failed: {str(e)}")
        raise
