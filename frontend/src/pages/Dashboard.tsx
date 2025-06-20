import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  UserPlus,
  Monitor as MonitorIcon,
  CheckCircle2,
  XCircle,
  Info,
  GitPullRequest,
  AlertCircle,
  FileText,
  Star,
  Repeat,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMonitors } from "@/hooks/useMonitors";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useRecentDigests } from "@/hooks/useRecentDigests";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  renderSlackFormatting,
  RecentDigestDropdown,
} from "@/components/MonitorDigestHistory";
import { useAuth } from "@/hooks/useAuth";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { RepoInput } from "@/components/RepoInput";
import { DeliverySettings } from "@/components/DeliverySettings";
import { DigestPreview } from "@/components/DigestPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { BillingStatus } from "@/components/BillingStatus";
import { useBilling } from "@/hooks/useBilling";

type OrgMetrics = {
  prs_opened: number;
  prs_closed: number;
  issues_opened: number;
  issues_closed: number;
  bugfixes: number;
  docs: number;
  features: number;
  refactors: number;
  perf: number;
};

function formatPercent(num: number) {
  return (num * 100).toFixed(0) + "%";
}

// Type guard for limits object
function hasLimit(obj: unknown, key: string): obj is { [k: string]: number } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    key in obj &&
    typeof (obj as Record<string, unknown>)[key] === "number"
  );
}

const PERIOD_OPTIONS = [
  { label: "Day", value: 1 },
  { label: "Week", value: 7 },
  { label: "Month", value: 30 },
];

const Dashboard = () => {
  const { monitors, loading: monitorsLoading } = useMonitors();
  const { members, loading: membersLoading } = useOrgMembers();
  const { digests, loading: digestsLoading } = useRecentDigests();
  const { user } = useAuth();
  const orgId = user?.org_id || "";
  const isAdmin = user?.role === "admin";
  const monitorCount = monitors?.length || 0;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const [periodDays, setPeriodDays] = useState(7);
  const [orgMetrics, setOrgMetrics] = useState<OrgMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedMonitorId, setExpandedMonitorId] = useState<string | null>(
    null
  );
  const [addMonitorOpen, setAddMonitorOpen] = useState(false);
  const [currentRepo, setCurrentRepo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "slack" | "discord" | "email"
  >("slack");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "on_merge">(
    "daily"
  );
  const [webhook, setWebhook] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const navigate = useNavigate();
  const { status: billingStatus } = useBilling(orgId);
  const isUnlimited = billingStatus?.is_internal;
  const monitorLimit = isUnlimited
    ? "Unlimited"
    : hasLimit(billingStatus?.limits, "max_repos")
    ? billingStatus!.limits["max_repos"]
    : 1;
  const channelLimit = isUnlimited
    ? "Unlimited"
    : hasLimit(billingStatus?.limits, "max_channels")
    ? billingStatus!.limits["max_channels"]
    : 1;

  // Quick stats
  const memberCount = members.length;
  const totalDigests = digests.length;
  const successCount = digests.filter((d) => d.status === "success").length;
  const deliverySuccess =
    totalDigests > 0 ? formatPercent(successCount / totalDigests) : "--";

  // Monitors summary (show up to 3)
  const summaryMonitors = monitors.slice(0, 3);

  // Recent activity (show up to 5 digests)
  const recentDigests = digests.slice(0, 5);

  // Calculate integration count (for now, assume 1 if any monitor has a delivery_method set)
  const integrationCount = monitors.filter((m) => m.delivery_method).length;
  const isAtMonitorLimit = monitorCount >= 1; // For free plan
  const isAtIntegrationLimit = integrationCount >= 1; // For free plan

  useEffect(() => {
    const fetchMetrics = async () => {
      setMetricsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/org/metrics?period_days=${periodDays}`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          setOrgMetrics(data.metrics);
          setLastUpdated(new Date());
        } else {
          setOrgMetrics(null);
        }
      } catch {
        setOrgMetrics(null);
      } finally {
        setMetricsLoading(false);
      }
    };
    fetchMetrics();
  }, [API_BASE_URL, periodDays]);

  const handleAddMonitor = async () => {
    if (!currentRepo || !webhook) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          repo: currentRepo,
          delivery_method: deliveryMethod,
          webhook_url: webhook,
          frequency,
        }),
      });
      if (res.ok) {
        setIsConfigured(true);
        setCurrentRepo("");
        setWebhook("");
        toast?.({
          title: "Monitoring started!",
          description: "Your repo is now being monitored.",
        });
        setAddMonitorOpen(false);
      } else {
        let errorText = "Failed to start monitoring.";
        try {
          const json = await res.json();
          errorText = json?.detail || errorText;
        } catch (err) {
          // ignore
        }
        setError(errorText);
        toast?.({
          title: "Error",
          description: errorText,
          variant: "destructive",
        });
      }
    } catch (e) {
      setError(String(e));
      toast?.({
        title: "Unexpected Error",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Defensive: always coerce orgMetrics values to numbers
  const safeOrgMetric = (key: keyof OrgMetrics) =>
    Number(orgMetrics?.[key] ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Dashboard Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span role="img" aria-label="wave">
                👋
              </span>
              {user?.username || user?.email?.split("@")[0] || "there"}, welcome
              back!
            </h1>
            <p className="text-slate-500 mt-1">
              Here's what's happening in your org today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => navigate("/monitors")}>
              <Plus className="w-4 h-4" /> Add Monitor
            </Button>
          </div>
        </div>
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="sr-only" id="period-label">
              Stats period
            </span>
            <div
              role="group"
              aria-labelledby="period-label"
              className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    periodDays === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                  }`}
                  onClick={() => setPeriodDays(opt.value)}
                  aria-pressed={periodDays === opt.value}>
                  {opt.label}
                </button>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex">
                  <Info
                    className="w-4 h-4 text-slate-400 ml-2 cursor-pointer"
                    aria-label="Stats period info"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Change the time period for all metrics
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {metricsLoading && (
              <Loader2
                className="w-4 h-4 animate-spin text-blue-400"
                aria-label="Loading metrics"
              />
            )}
          </div>
        </div>
        {/* Main Org Metrics */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 transition-opacity duration-300"
          style={{ opacity: metricsLoading ? 0.5 : 1 }}>
          <Card className="p-6 flex flex-col items-center">
            <GitPullRequest className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-2xl font-bold transition-all duration-300">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
              ) : (
                safeOrgMetric("prs_opened")
              )}
            </div>
            <div className="text-xs text-slate-500">PRs Opened</div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <AlertCircle className="w-6 h-6 text-emerald-600 mb-2" />
            <div className="text-2xl font-bold transition-all duration-300">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-300" />
              ) : (
                safeOrgMetric("issues_closed")
              )}
            </div>
            <div className="text-xs text-slate-500">Issues Closed</div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <Star className="w-6 h-6 text-orange-500 mb-2" />
            <div className="text-2xl font-bold transition-all duration-300">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-orange-300" />
              ) : (
                safeOrgMetric("bugfixes")
              )}
            </div>
            <div className="text-xs text-slate-500">Bugfixes</div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-2xl font-bold transition-all duration-300">
              {metricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-300" />
              ) : (
                deliverySuccess
              )}
            </div>
            <div className="text-xs text-slate-500">Delivery Success</div>
          </Card>
        </div>
        {/* Divider for separation */}
        <div className="mb-2 md:mb-4" />
        {/* Secondary Org Metrics */}
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 mb-1">
                    <GitPullRequest className="w-5 h-5 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>PRs Closed in selected period</TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                ) : (
                  safeOrgMetric("prs_closed")
                )}
              </div>
              <div className="text-xs text-slate-400">PRs Closed</div>
            </Card>
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 group-hover:bg-emerald-100 mb-1">
                    <AlertCircle className="w-5 h-5 text-emerald-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Issues Opened in selected period
                </TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                ) : (
                  safeOrgMetric("issues_opened")
                )}
              </div>
              <div className="text-xs text-slate-400">Issues Opened</div>
            </Card>
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 group-hover:bg-purple-100 mb-1">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Docs changes in selected period</TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                ) : (
                  safeOrgMetric("docs")
                )}
              </div>
              <div className="text-xs text-slate-400">Docs</div>
            </Card>
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-yellow-50 group-hover:bg-yellow-100 mb-1">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Features shipped in selected period
                </TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-200" />
                ) : (
                  safeOrgMetric("features")
                )}
              </div>
              <div className="text-xs text-slate-400">Features</div>
            </Card>
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 group-hover:bg-slate-200 mb-1">
                    <Repeat className="w-5 h-5 text-slate-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Refactors in selected period</TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-200" />
                ) : (
                  safeOrgMetric("refactors")
                )}
              </div>
              <div className="text-xs text-slate-400">Refactors</div>
            </Card>
            <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl transition-transform hover:scale-[1.025] hover:shadow-md group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-50 group-hover:bg-green-100 mb-1">
                    <Zap className="w-5 h-5 text-green-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Performance improvements in selected period
                </TooltipContent>
              </Tooltip>
              <div className="text-lg font-semibold transition-all duration-300">
                {metricsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-green-200" />
                ) : (
                  safeOrgMetric("perf")
                )}
              </div>
              <div className="text-xs text-slate-400">Perf</div>
            </Card>
          </div>
        </TooltipProvider>
        {/* Secondary stats: Monitors, Integrations, Team, Upgrade CTA */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <Badge variant="outline" className="text-xs px-3 py-1">
            Monitors:{" "}
            {isUnlimited ? "Unlimited" : `${monitorCount}/${monitorLimit}`}
          </Badge>
          <Badge variant="outline" className="text-xs px-3 py-1">
            Slack:{" "}
            {isUnlimited ? "Unlimited" : `${integrationCount}/${channelLimit}`}
          </Badge>
          {(isAtMonitorLimit || isAtIntegrationLimit) && !isUnlimited && (
            <Button
              className="ml-2 bg-blue-600 text-white text-xs px-4 py-2"
              size="sm"
              onClick={() => navigate("/billing")}>
              Upgrade for more on
            </Button>
          )}
        </div>
        {/* Monitors Summary */}
        <Card className="p-6 mb-10">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MonitorIcon className="w-5 h-5 text-blue-600" /> Monitors Summary
            <Link
              to="/monitors"
              className="ml-auto text-blue-600 text-sm underline">
              View All
            </Link>
          </div>
          {monitorsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : summaryMonitors.length === 0 ? (
            <div className="text-slate-500">
              No monitors found.{" "}
              <Link to="/monitors" className="underline">
                Add one
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-3">
              {summaryMonitors.map((m) => {
                const recentDigest = digests.find((d) => d.monitorId === m.id);
                const isExpanded = expandedMonitorId === m.id;
                return (
                  <Link
                    key={m.id}
                    to={`/monitors/${m.id}`}
                    className="block group"
                    tabIndex={0}
                    style={{ textDecoration: "none" }}>
                    <Card
                      className="p-4 bg-white/80 shadow hover:bg-slate-50 transition-colors rounded-lg flex flex-col gap-2 group-hover:ring-2 group-hover:ring-blue-200 cursor-pointer"
                      onClick={(e) => {
                        /* allow Link to handle navigation */
                      }}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-blue-700 truncate text-lg font-semibold flex items-center gap-2">
                            <a
                              href={`https://github.com/${m.repo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${m.repo} on GitHub`}
                              className="ml-0 text-blue-600 hover:text-blue-600 transition-colors hover:underline focus:underline"
                              onClick={(e) => e.stopPropagation()} // Prevent card navigation
                            >
                              {m.repo}
                            </a>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4 inline">
                              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z" />
                            </svg>
                          </span>
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
                          <Link
                            to={`/monitors/${m.id}`}
                            onClick={(e) => e.stopPropagation()}>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {recentDigest && (
                            <>
                              <Badge
                                className={
                                  recentDigest.status === "success"
                                    ? "bg-green-100 text-green-700"
                                    : recentDigest.status === "failure"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                                }>
                                {recentDigest.status.charAt(0).toUpperCase() +
                                  recentDigest.status.slice(1)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={
                                  isExpanded
                                    ? "Hide recent digest"
                                    : "Show recent digest"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMonitorId(
                                    isExpanded ? null : m.id
                                  );
                                }}>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Collapsible digest section inside card */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded && recentDigest
                            ? "max-h-[500px] opacity-100 mt-2"
                            : "max-h-0 opacity-0"
                        } bg-slate-50 rounded border border-slate-200`}
                        aria-hidden={!isExpanded || !recentDigest}>
                        {isExpanded && recentDigest && (
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={
                                  recentDigest.status === "success"
                                    ? "bg-green-100 text-green-700"
                                    : recentDigest.status === "failure"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                                }>
                                {recentDigest.status.charAt(0).toUpperCase() +
                                  recentDigest.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(
                                  recentDigest.delivered_at
                                ).toLocaleString()}
                              </span>
                              <Badge variant="secondary" className="ml-2">
                                {recentDigest.delivery_method}
                              </Badge>
                            </div>
                            <div className="font-bold text-blue-700 mb-1 flex items-center gap-2 text-base">
                              <span role="img" aria-label="digest">
                                📊
                              </span>{" "}
                              Daily Digest: {m.repo}
                            </div>
                            {/* Metrics display */}
                            {recentDigest.metrics_json && (
                              <div className="mb-2 text-xs text-slate-600 flex flex-wrap gap-3">
                                <span>
                                  PRs opened:{" "}
                                  {recentDigest.metrics_json.prs_opened ?? 0}
                                </span>
                                <span>
                                  PRs closed:{" "}
                                  {recentDigest.metrics_json.prs_closed ?? 0}
                                </span>
                                <span>
                                  Issues opened:{" "}
                                  {recentDigest.metrics_json.issues_opened ?? 0}
                                </span>
                                <span>
                                  Issues closed:{" "}
                                  {recentDigest.metrics_json.issues_closed ?? 0}
                                </span>
                                {recentDigest.metrics_json.bugfixes &&
                                  Array.isArray(
                                    recentDigest.metrics_json.bugfixes
                                  ) &&
                                  recentDigest.metrics_json.bugfixes.length >
                                    0 && (
                                    <span>
                                      🐛 Bugfixes:{" "}
                                      {
                                        recentDigest.metrics_json.bugfixes
                                          .length
                                      }
                                    </span>
                                  )}
                                {recentDigest.metrics_json.docs &&
                                  Array.isArray(
                                    recentDigest.metrics_json.docs
                                  ) &&
                                  recentDigest.metrics_json.docs.length > 0 && (
                                    <span>
                                      📝 Docs:{" "}
                                      {recentDigest.metrics_json.docs.length}
                                    </span>
                                  )}
                                {recentDigest.metrics_json.features &&
                                  Array.isArray(
                                    recentDigest.metrics_json.features
                                  ) &&
                                  recentDigest.metrics_json.features.length >
                                    0 && (
                                    <span>
                                      ✨ Features:{" "}
                                      {
                                        recentDigest.metrics_json.features
                                          .length
                                      }
                                    </span>
                                  )}
                                {recentDigest.metrics_json.refactors &&
                                  Array.isArray(
                                    recentDigest.metrics_json.refactors
                                  ) &&
                                  recentDigest.metrics_json.refactors.length >
                                    0 && (
                                    <span>
                                      ♻️ Refactors:{" "}
                                      {
                                        recentDigest.metrics_json.refactors
                                          .length
                                      }
                                    </span>
                                  )}
                                {recentDigest.metrics_json.perf &&
                                  Array.isArray(
                                    recentDigest.metrics_json.perf
                                  ) &&
                                  recentDigest.metrics_json.perf.length > 0 && (
                                    <span>
                                      ⚡️ Perf:{" "}
                                      {recentDigest.metrics_json.perf.length}
                                    </span>
                                  )}
                              </div>
                            )}
                            <div className="my-2 border-t border-slate-200" />
                            <div className="text-slate-700 break-words bg-slate-50 rounded px-3 py-2 mt-1 text-sm leading-relaxed whitespace-pre-line border border-slate-100">
                              {recentDigest.summary ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: renderSlackFormatting(
                                      recentDigest.summary
                                    ),
                                  }}
                                />
                              ) : (
                                <span className="text-slate-400 italic">
                                  No summary
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" /> Recent Activity
          </div>
          {digestsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : recentDigests.length === 0 ? (
            <div className="text-slate-500 italic text-center py-6">
              No recent activity yet.
              <br />
              When your monitors deliver digests, they will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentDigests.map((d) => (
                <Link
                  key={d.id}
                  to={`/monitors/${d.monitorId}`}
                  className="block group"
                  tabIndex={0}
                  style={{ textDecoration: "none" }}>
                  <Card className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white/80 shadow group-hover:ring-2 group-hover:ring-blue-200 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      {d.status === "success" ? (
                        <CheckCircle2 className="w-5 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-4 text-red-600" />
                      )}
                      <span className="font-mono text-blue-700 truncate text-sm font-semibold">
                        {d.repo}
                      </span>
                      <Badge variant="outline" className="capitalize ml-2">
                        {d.delivery_method}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                      {/* {d.summary} */}
                      {d.metrics_json && (
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>
                            🔀 {d.metrics_json.prs_opened ?? 0} PRs opened,{" "}
                            {d.metrics_json.prs_closed ?? 0} closed
                          </span>
                          <span>
                            ✨ {d.metrics_json.issues_opened ?? 0} issues
                            opened, {d.metrics_json.issues_closed ?? 0} closed
                          </span>
                          {d.metrics_json.bugfixes &&
                            Array.isArray(d.metrics_json.bugfixes) &&
                            d.metrics_json.bugfixes.length > 0 && (
                              <span>
                                🐛 Bugfixes: {d.metrics_json.bugfixes.length}
                              </span>
                            )}
                          {d.metrics_json.docs &&
                            Array.isArray(d.metrics_json.docs) &&
                            d.metrics_json.docs.length > 0 && (
                              <span>📝 Docs: {d.metrics_json.docs.length}</span>
                            )}
                          {d.metrics_json.features &&
                            Array.isArray(d.metrics_json.features) &&
                            d.metrics_json.features.length > 0 && (
                              <span>
                                ✨ Features: {d.metrics_json.features.length}
                              </span>
                            )}
                          {d.metrics_json.refactors &&
                            Array.isArray(d.metrics_json.refactors) &&
                            d.metrics_json.refactors.length > 0 && (
                              <span>
                                ♻️ Refactors: {d.metrics_json.refactors.length}
                              </span>
                            )}
                          {d.metrics_json.perf &&
                            Array.isArray(d.metrics_json.perf) &&
                            d.metrics_json.perf.length > 0 && (
                              <span>
                                ⚡️ Perf: {d.metrics_json.perf.length}
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-500">
                        {new Date(d.delivered_at).toLocaleString()}
                      </span>
                      {d.status === "failure" && d.error_message && (
                        <span className="text-xs text-red-600">
                          {d.error_message}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>
        {/* Add gap between Recent Activity and Plan card */}
        <div className="mb-8" />
        <div className="mb-6">
          {orgId && (
            <BillingStatus
              orgId={orgId}
              monitorCount={monitorCount}
              plan={billingStatus?.plan ?? "-"}
              maxRepos={
                billingStatus?.is_internal
                  ? "unlimited"
                  : hasLimit(billingStatus?.limits, "max_repos")
                  ? billingStatus!.limits["max_repos"]
                  : 1
              }
              isInternal={!!billingStatus?.is_internal}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
