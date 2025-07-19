import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonitorDigestHistory } from "@/components/MonitorDigestHistory";
import { toast } from "@/hooks/use-toast";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  GitBranch,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const PERIOD_OPTIONS = [
  { label: "Day", value: 1 },
  { label: "Week", value: 7 },
  { label: "Month", value: 30 },
];

const METRIC_LABELS = [
  {
    key: "prs_opened",
    label: "PRs Opened",
    desc: "Number of pull requests opened.",
  },
  {
    key: "prs_closed",
    label: "PRs Closed",
    desc: "Number of pull requests closed.",
  },
  {
    key: "issues_opened",
    label: "Issues Opened",
    desc: "Number of issues opened.",
  },
  {
    key: "issues_closed",
    label: "Issues Closed",
    desc: "Number of issues closed.",
  },
  {
    key: "bugfixes",
    label: "Bugfixes",
    desc: "Bugfix PRs/issues detected by keywords.",
  },
  {
    key: "docs",
    label: "Docs",
    desc: "Documentation changes detected by keywords.",
  },
  {
    key: "features",
    label: "Features",
    desc: "Feature PRs/issues detected by keywords.",
  },
  {
    key: "refactors",
    label: "Refactors",
    desc: "Refactor PRs/issues detected by keywords.",
  },
  {
    key: "perf",
    label: "Perf",
    desc: "Performance improvements detected by keywords.",
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface MonitorMetrics {
  prs_opened: number;
  prs_closed: number;
  issues_opened: number;
  issues_closed: number;
  bugfixes: number;
  docs: number;
  features: number;
  refactors: number;
  perf: number;
  [key: string]: number;
}

interface TimeseriesPoint {
  date: string;
  prs_opened: number;
  prs_closed: number;
  issues_opened: number;
  issues_closed: number;
  bugfixes: number;
  docs: number;
  features: number;
  refactors: number;
  perf: number;
}

// Define Monitor type for repo fetch
interface Monitor {
  id: string;
  repo: string;
  delivery_method: string;
  webhook_url: string;
  frequency: string;
  created_at: string;
  is_private: boolean;
  created_by?: string;
}

const getTrend = (current: number, prev: number) => {
  if (prev === 0 && current === 0)
    return { icon: Minus, color: "text-slate-400", diff: 0 };
  if (prev === 0)
    return { icon: ArrowUpRight, color: "text-green-600", diff: current };
  if (current > prev)
    return {
      icon: ArrowUpRight,
      color: "text-green-600",
      diff: current - prev,
    };
  if (current < prev)
    return {
      icon: ArrowDownRight,
      color: "text-red-600",
      diff: current - prev,
    };
  return { icon: Minus, color: "text-slate-400", diff: 0 };
};

const DEFAULT_CHART_METRIC = "prs_opened";
const FREQUENCIES = ["daily"] as const; // "weekly", "on_merge"

const MonitorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useOrgMembers();
  const currentMember = members.find((m) => m.user_id === user?.sub);
  const isViewer = currentMember?.role === "viewer";

  const [periodDays, setPeriodDays] = useState(7);
  const [metrics, setMetrics] = useState<MonitorMetrics | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<MonitorMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState(DEFAULT_CHART_METRIC);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [frequencyLoading, setFrequencyLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setMetricsLoading(true);
    fetch(
      `${API_BASE_URL}/api/v1/monitor/${id}/metrics?period_days=${periodDays}&compare_to_previous=true`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics);
        setPrevMetrics(data.previous_metrics);
        setLastUpdated(new Date());
      })
      .finally(() => setMetricsLoading(false));
  }, [id, periodDays]);

  useEffect(() => {
    if (!id) return;
    setSeriesLoading(true);
    fetch(
      `${API_BASE_URL}/api/v1/monitor/${id}/metrics/timeseries?period_days=${periodDays}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => setTimeseries(data.timeseries || []))
      .finally(() => setSeriesLoading(false));
  }, [id, periodDays]);

  useEffect(() => {
    if (!id) return;
    // Fetch monitor details for this monitor
    fetch(`${API_BASE_URL}/api/v1/monitor`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const found = (data.monitors as Monitor[] | undefined)?.find(
          (m) => m.id === id
        );
        setMonitor(found || null);
      });
  }, [id]);

  const handleEditFrequency = async (newFreq: string) => {
    if (!id || !monitor) return;

    setFrequencyLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ frequency: newFreq }),
      });

      if (res.ok) {
        setMonitor((prev) => (prev ? { ...prev, frequency: newFreq } : null));
        toast?.({
          title: "Monitor updated",
          description: `Frequency updated to ${newFreq}`,
        });
      } else {
        const err = await res.json();
        toast?.({
          title: "Error",
          description: err.detail || "Failed to update monitor",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast?.({
        title: "Error",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setFrequencyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !monitor) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast?.({
          title: "Monitor deleted",
          description: `Successfully deleted monitor for ${monitor.repo}`,
        });
        navigate("/monitors");
      } else {
        const err = await res.json();
        toast?.({
          title: "Error",
          description: err.detail || "Failed to delete monitor",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast?.({
        title: "Error",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const chartMetricLabel =
    METRIC_LABELS.find((m) => m.key === chartMetric)?.label || "";
  const chartMetricDesc =
    METRIC_LABELS.find((m) => m.key === chartMetric)?.desc || "";
  const chartHasData = timeseries.some((d) => d[chartMetric] > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/monitors")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back to Monitors
            </Button>
            {monitor && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>/</span>
                <span className="font-mono text-slate-700">{monitor.repo}</span>
              </div>
            )}
          </div>
          {!isViewer && monitor && (
            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Monitor
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Monitor</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the monitor for{" "}
                    <span className="font-mono font-semibold">
                      {monitor.repo}
                    </span>
                    ? This action cannot be undone and will stop all digest
                    deliveries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteLoading}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700">
                    {deleteLoading ? "Deleting..." : "Delete Monitor"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-1">Monitor Details</h1>
        {!monitor && !membersLoading ? (
          <div className="text-center py-8">
            <div className="text-slate-500 mb-2">Monitor not found</div>
            <Button
              variant="outline"
              onClick={() => navigate("/monitors")}
              className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Monitors
            </Button>
          </div>
        ) : !monitor && membersLoading ? (
          <div className="text-center py-8">
            <div className="text-slate-500 mb-2">
              Loading monitor details...
            </div>
          </div>
        ) : monitor ? (
          <>
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-mono text-lg">
              <GitBranch className="w-5 h-5" />
              <span className="flex items-center gap-2">
                {monitor.repo}
                <a
                  href={`https://github.com/${monitor.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${monitor.repo} on GitHub`}
                  className="ml-1 text-slate-400 hover:text-blue-600 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 inline">
                    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z" />
                  </svg>
                </a>
              </span>
            </div>
            <Card className="mb-6 p-4 bg-white/80 border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    Delivery Method
                  </div>
                  <div className="font-semibold capitalize flex items-center gap-2">
                    {monitor.delivery_method}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    Update Frequency
                    {!isViewer && (
                      <span className="text-slate-400 text-xs">
                        (click to edit)
                      </span>
                    )}
                  </div>
                  <div className="font-semibold capitalize flex items-center gap-2">
                    {!isViewer ? (
                      <Select
                        value={monitor.frequency}
                        onValueChange={handleEditFrequency}
                        disabled={frequencyLoading}>
                        <SelectTrigger className="w-[140px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {freq === "daily"
                                ? "Daily"
                                : freq === "weekly"
                                ? "Weekly"
                                : freq === "on_merge"
                                ? "On Merge"
                                : freq}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span>
                        {monitor.frequency === "daily"
                          ? "Daily"
                          : monitor.frequency === "weekly"
                          ? "Weekly"
                          : monitor.frequency === "on_merge"
                          ? "On Merge"
                          : monitor.frequency}
                      </span>
                    )}
                    {frequencyLoading && (
                      <span className="text-xs text-slate-400">
                        Updating...
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    Slack Webhook URL
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded break-all">
                      {monitor.webhook_url}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-blue-600"
                      title="Copy Webhook URL"
                      onClick={() => {
                        navigator.clipboard.writeText(monitor.webhook_url);
                      }}>
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
                          d="M8.25 4.5h-2.25A2.25 2.25 0 0 0 3.75 6.75v10.5A2.25 2.25 0 0 0 6 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-2.25M16.5 3.75h3.75v3.75M21 3l-9.75 9.75"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : null}
        {monitor && (
          <>
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-lg">Metrics Summary</div>
                <div className="flex gap-1 items-center">
                  {PERIOD_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={periodDays === opt.value ? "default" : "outline"}
                      className="text-xs px-3 py-1"
                      onClick={() => setPeriodDays(opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                  {lastUpdated && (
                    <span className="text-xs text-slate-400 ml-3">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              {/* Metrics summary cards with tooltips */}
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {METRIC_LABELS.map(({ key, label, desc }) => {
                    const value = metrics?.[key] ?? 0;
                    const prev = prevMetrics?.[key] ?? 0;
                    const {
                      icon: TrendIcon,
                      color,
                      diff,
                    } = getTrend(value, prev);
                    return (
                      <UITooltip key={key}>
                        <TooltipTrigger asChild>
                          <Card className="p-4 flex flex-col items-center bg-white/80 border border-slate-100 shadow-sm rounded-xl cursor-help">
                            <div className="text-lg font-semibold">
                              {metricsLoading ? (
                                <span className="animate-pulse">--</span>
                              ) : (
                                value
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              {label}
                            </div>
                            {!metricsLoading && (
                              <span
                                className={`flex items-center gap-1 text-xs font-medium ${color}`}>
                                <TrendIcon className="w-4 h-4" />
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent>{desc}</TooltipContent>
                      </UITooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              {/* Chart metric selector and chart info tooltip */}
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">Metric:</div>
                <div className="flex gap-1">
                  {METRIC_LABELS.map((m) => (
                    <Button
                      key={m.key}
                      size="sm"
                      variant={chartMetric === m.key ? "default" : "outline"}
                      className="text-xs px-2 py-1"
                      onClick={() => setChartMetric(m.key)}>
                      {m.label}
                    </Button>
                  ))}
                </div>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex ml-2">
                      <Info
                        className="w-4 h-4 text-slate-400 cursor-pointer"
                        aria-label="Chart info"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Shows count for the selected metric. {chartMetricDesc}
                  </TooltipContent>
                </UITooltip>
              </div>
              {/* Trend chart */}
              <div className="mb-4">
                <div className="font-semibold mb-2">
                  {chartMetricLabel} (last {periodDays}d)
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-slate-100">
                  {seriesLoading ? (
                    <div className="h-32 flex items-center justify-center text-slate-400">
                      Loading…
                    </div>
                  ) : !chartHasData ? (
                    <div className="h-32 flex items-center justify-center text-slate-400">
                      No data for this metric in the selected period.
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        [chartMetric]: {
                          color: "#2563eb",
                          label: chartMetricLabel,
                        },
                      }}
                      style={{ width: "100%", height: 240 }}>
                      <RechartsPrimitive.LineChart
                        data={timeseries}
                        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
                        <RechartsPrimitive.XAxis
                          dataKey="date"
                          fontSize={12}
                          tick={{ fill: "#64748b" }}
                        />
                        <RechartsPrimitive.YAxis
                          fontSize={12}
                          tick={{ fill: "#64748b" }}
                        />
                        <RechartsPrimitive.Tooltip />
                        <RechartsPrimitive.Line
                          type="monotone"
                          dataKey={chartMetric}
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive
                        />
                      </RechartsPrimitive.LineChart>
                    </ChartContainer>
                  )}
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="mb-4 font-semibold text-lg">Digest History</div>
              {id && <MonitorDigestHistory monitorId={id} repo={""} />}
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default MonitorDetailPage;
