from supabase import create_client
from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from typing import List, Any, Optional, Dict


class DigestService:
    def __init__(self) -> None:
        if SUPABASE_URL is None or SUPABASE_SERVICE_ROLE_KEY is None:
            raise ValueError("Supabase environment variables not set")
        self.client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    def get_monitor_digests(
        self, monitor_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        digests_result = (
            self.client.table("digests")
            .select(
                "id, summary, status, delivered_at, error_message, delivery_method, metrics_json"
            )
            .eq("monitor_id", monitor_id)
            .order("delivered_at", desc=True)
            .limit(limit)
            .execute()
        )
        if digests_result and digests_result.data:
            return list(digests_result.data)
        return []

    def log_digest(
        self,
        monitor_id: str,
        summary: str,
        status: str,
        delivered_at: Any,
        delivery_method: str,
        error_message: Optional[str] = None,
        created_by: Optional[str] = None,
        raw_payload: Any = None,
        metrics_json: Optional[Dict[str, Any]] = None,
    ) -> None:
        digest = {
            "monitor_id": monitor_id,
            "summary": summary,
            "status": status,
            "delivered_at": delivered_at,
            "delivery_method": delivery_method,
            "error_message": error_message,
            "created_by": created_by,
            "raw_payload": raw_payload,
            "metrics_json": metrics_json or {},
        }
        self.client.table("digests").insert(digest).execute()

    def aggregate_metrics(
        self,
        org_id: str,
        monitor_id: Optional[str] = None,
        period_days: int = 7,
        offset_days: int = 0,
    ) -> Dict[str, int]:
        from datetime import datetime, timedelta

        since = (
            datetime.utcnow() - timedelta(days=period_days + offset_days)
        ).isoformat()
        until = (
            (datetime.utcnow() - timedelta(days=offset_days)).isoformat()
            if offset_days > 0
            else None
        )
        # Always fetch all monitor IDs for the org that are not deleted
        monitor_ids = []
        if not monitor_id:
            from services.monitor import MonitorService

            monitor_service = MonitorService()
            monitors = (
                monitor_service.client.table("monitors")
                .select("id")
                .eq("org_id", org_id)
                .eq("deleted", False)
                .execute()
            )
            monitor_ids = [m["id"] for m in (monitors.data or [])]
        query = self.client.table("digests").select("metrics_json,monitor_id")
        if monitor_id:
            query = query.eq("monitor_id", monitor_id)
        elif monitor_ids:
            query = query.in_("monitor_id", monitor_ids)
        query = query.gte("delivered_at", since)
        if until:
            query = query.lt("delivered_at", until)
        resp = query.execute()
        digests = resp.data if resp and resp.data else []
        # If org_id, filter out digests whose monitor_id is not in the active list (defensive)
        digests = [d for d in digests if d.get("monitor_id") in monitor_ids]
        # Aggregate metrics
        totals: Dict[str, int] = {
            "prs_opened": 0,
            "prs_closed": 0,
            "issues_opened": 0,
            "issues_closed": 0,
            "bugfixes": 0,
            "docs": 0,
            "features": 0,
            "refactors": 0,
            "perf": 0,
        }
        for d in digests:
            m = d.get("metrics_json") or {}
            totals["prs_opened"] += int(m.get("prs_opened", 0) or 0)
            totals["prs_closed"] += int(m.get("prs_closed", 0) or 0)
            totals["issues_opened"] += int(m.get("issues_opened", 0) or 0)
            totals["issues_closed"] += int(m.get("issues_closed", 0) or 0)
            totals["bugfixes"] += len(list(m.get("bugfixes", []) or []))
            totals["docs"] += len(list(m.get("docs", []) or []))
            totals["features"] += len(list(m.get("features", []) or []))
            totals["refactors"] += len(list(m.get("refactors", []) or []))
            totals["perf"] += len(list(m.get("perf", []) or []))
        return totals

    def _days_ago_iso(self, days: int) -> str:
        from datetime import datetime, timedelta

        return (datetime.utcnow() - timedelta(days=days)).isoformat()

    def timeseries_metrics(
        self, monitor_id: str, period_days: int = 30
    ) -> List[Dict[str, Any]]:
        from datetime import datetime, timedelta
        import collections

        now = datetime.utcnow()
        if period_days == 1:
            since = now - timedelta(days=1)
            # Fetch all digests in the last 24 hours
            resp = (
                self.client.table("digests")
                .select("delivered_at, metrics_json")
                .eq("monitor_id", monitor_id)
                .gte("delivered_at", since.isoformat())
                .order("delivered_at")
                .execute()
            )
            digests = resp.data if resp and resp.data else []
            # Aggregate all into a single bucket
            totals = {
                "date": now.date().isoformat(),
                "prs_opened": 0,
                "prs_closed": 0,
                "issues_opened": 0,
                "issues_closed": 0,
                "bugfixes": 0,
                "docs": 0,
                "features": 0,
                "refactors": 0,
                "perf": 0,
            }
            for d in digests:
                m = d.get("metrics_json") or {}
                totals["prs_opened"] += int(m.get("prs_opened", 0) or 0)
                totals["prs_closed"] += int(m.get("prs_closed", 0) or 0)
                totals["issues_opened"] += int(m.get("issues_opened", 0) or 0)
                totals["issues_closed"] += int(m.get("issues_closed", 0) or 0)
                totals["bugfixes"] += int(m.get("bugfixes", 0) or 0)
                totals["docs"] += int(m.get("docs", 0) or 0)
                totals["features"] += int(m.get("features", 0) or 0)
                totals["refactors"] += int(m.get("refactors", 0) or 0)
                totals["perf"] += int(m.get("perf", 0) or 0)
            return [totals]
        else:
            # Ensure the range includes today (from midnight period_days-1 days ago to now)
            since = (now - timedelta(days=period_days - 1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            # Fetch all digests for this monitor in the period
            resp = (
                self.client.table("digests")
                .select("delivered_at, metrics_json")
                .eq("monitor_id", monitor_id)
                .gte("delivered_at", since.isoformat())
                .order("delivered_at")
                .execute()
            )
            digests = resp.data if resp and resp.data else []
            # Group by day
            day_buckets = collections.defaultdict(list)
            for d in digests:
                dt = d["delivered_at"][:10]  # YYYY-MM-DD
                day_buckets[dt].append(d["metrics_json"] or {})
            # For each day, aggregate metrics
            results = []
            for i in range(period_days):
                day = (since + timedelta(days=i)).date().isoformat()
                metrics_list = day_buckets.get(day, [])
                totals: Dict[str, Any] = {
                    "date": day,
                    "prs_opened": 0,
                    "prs_closed": 0,
                    "issues_opened": 0,
                    "issues_closed": 0,
                    "bugfixes": 0,
                    "docs": 0,
                    "features": 0,
                    "refactors": 0,
                    "perf": 0,
                }
                for m in metrics_list:
                    totals["prs_opened"] += int(m.get("prs_opened", 0) or 0)
                    totals["prs_closed"] += int(m.get("prs_closed", 0) or 0)
                    totals["issues_opened"] += int(m.get("issues_opened", 0) or 0)
                    totals["issues_closed"] += int(m.get("issues_closed", 0) or 0)
                    totals["bugfixes"] += int(m.get("bugfixes", 0) or 0)
                    totals["docs"] += int(m.get("docs", 0) or 0)
                    totals["features"] += int(m.get("features", 0) or 0)
                    totals["refactors"] += int(m.get("refactors", 0) or 0)
                    totals["perf"] += int(m.get("perf", 0) or 0)
                results.append(totals)
            return results
