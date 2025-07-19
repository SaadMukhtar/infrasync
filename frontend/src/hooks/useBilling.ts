import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type BillingStatus = {
  plan: string;
  usage: number;
  limit: number;
  [key: string]: unknown; // Add more fields as needed, or make it stricter
};

export function useBilling(orgId: string | undefined) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/v1/billing/status?org_id=${orgId}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error("Billing status fetch error:", text);
          throw new Error("Failed to fetch billing status");
        }
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orgId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
}
