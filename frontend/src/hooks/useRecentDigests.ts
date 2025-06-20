import { useEffect, useState } from "react";
import { useMonitors, Monitor } from "./useMonitors";

export interface Digest {
  id: string;
  summary: string;
  status: string;
  delivered_at: string;
  error_message?: string;
  delivery_method: string;
  monitorId: string;
  repo: string;
  metrics_json?: {
    prs_opened?: number;
    prs_closed?: number;
    issues_opened?: number;
    issues_closed?: number;
    bugfixes?: string[];
    docs?: string[];
    features?: string[];
    refactors?: string[];
    perf?: string[];
    [key: string]: unknown;
  };
}

export function useRecentDigests(monitorIds?: string[]) {
  const { monitors, loading: monitorsLoading } = useMonitors();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (monitorsLoading) return;

    if (
      (monitorIds && monitorIds.length === 0) ||
      (!monitorIds && monitors.length === 0)
    ) {
      setDigests([]);
      setLoading(false);
      return;
    }

    const fetchAllDigests = async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = monitorIds || monitors.map((m) => m.id);
        const digestsArr: Digest[] = [];
        for (const m of monitors.filter((m) => ids.includes(m.id))) {
          const res = await fetch(
            `${API_BASE_URL}/api/v1/monitor/${m.id}/digests?limit=3`,
            {
              credentials: "include",
            }
          );
          if (res.ok) {
            const data = await res.json();
            (data.digests || []).forEach((d: Partial<Digest>) => {
              digestsArr.push({
                ...d,
                monitorId: m.id,
                repo: m.repo,
              } as Digest);
            });
          }
        }
        // Sort by delivered_at desc
        digestsArr.sort(
          (a, b) =>
            new Date(b.delivered_at).getTime() -
            new Date(a.delivered_at).getTime()
        );
        setDigests(digestsArr);
      } catch (e) {
        setError("Error loading digests");
        setDigests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDigests();
  }, [monitors, monitorsLoading, monitorIds, API_BASE_URL]);

  return { digests, loading: loading || monitorsLoading, error };
}
