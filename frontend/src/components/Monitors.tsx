import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Monitor as MonitorIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useAuth } from "@/hooks/useAuth";

export interface Monitor {
  id: string;
  repo: string;
  delivery_method: string;
  webhook_url: string;
  frequency: string;
  created_at: string;
  is_private: boolean;
  created_by?: string;
}

export const Monitors = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // monitor id
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const { user } = useAuth();
  const { members, loading: membersLoading } = useOrgMembers();
  const currentMember = members.find((m) => m.user_id === user?.sub);
  const isViewer = currentMember?.role === "viewer";

  const fetchMonitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
        console.info("[Monitors] Loaded monitors", data.monitors);
      } else {
        setError("Failed to load monitors");
        setMonitors([]);
      }
    } catch (e) {
      setError("Error loading monitors");
      setMonitors([]);
      console.error("[Monitors] Error fetching monitors", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
    // Optionally, add polling or websocket for real-time updates
  }, [API_BASE_URL]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this monitor?"))
      return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMonitors((prev) => prev.filter((m) => m.id !== id));
        toast?.({ title: "Monitor deleted" });
        console.info(`[Monitors] Deleted monitor ${id}`);
      } else {
        const err = await res.json();
        toast?.({
          title: "Error",
          description: err.detail || "Failed to delete monitor",
          variant: "destructive",
        });
        console.error(`[Monitors] Failed to delete monitor ${id}`, err);
      }
    } catch (e) {
      toast?.({
        title: "Error",
        description: String(e),
        variant: "destructive",
      });
      console.error(`[Monitors] Error deleting monitor ${id}`, e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MonitorIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Your Monitors</h2>
        </div>
      </div>

      {loading ? (
        <div>Loading monitors…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : monitors.length === 0 ? (
        <div className="text-slate-500">No monitors found.</div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m, idx) => (
            <div key={m.id}>
              <Link to={`/monitors/${m.id}`} className="block group">
                <Card className="p-4 bg-white/80 shadow-lg hover:bg-slate-50 transition-colors rounded-lg flex flex-col gap-2 group-hover:ring-2 group-hover:ring-blue-200 cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <a
                        href={`https://github.com/${m.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-700 truncate text-lg font-semibold hover:underline focus:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent card navigation
                      >
                        {m.repo}
                      </a>
                      {m.is_private ? (
                        <span className="ml-2">
                          <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded">
                            Private
                          </span>
                        </span>
                      ) : (
                        <span className="ml-2">
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                            Public
                          </span>
                        </span>
                      )}
                      <Badge variant="outline" className="capitalize ml-2">
                        {m.delivery_method}
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {m.frequency === "daily"
                          ? "Daily"
                          : m.frequency === "weekly"
                          ? "Weekly"
                          : m.frequency === "on_merge"
                          ? "On Merge"
                          : m.frequency}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isViewer && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === m.id}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(m.id);
                          }}>
                          {actionLoading === m.id ? "Deleting…" : "Delete"}
                        </Button>
                      )}
                      <Link
                        to={`/monitors/${m.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 transition-all shadow-sm border border-blue-700/10"
                        style={{ minHeight: 36 }}
                        onClick={(e) => e.stopPropagation()} // Prevent card navigation
                      >
                        View Details
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </Card>
              </Link>
              {idx < monitors.length - 1 && (
                <div className="my-3 border-t border-slate-100" />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
