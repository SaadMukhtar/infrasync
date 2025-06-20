import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface Digest {
  id: string;
  summary: string;
  status: string;
  delivered_at: string;
  error_message?: string;
  delivery_method: string;
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

interface MonitorDigestHistoryProps {
  monitorId: string;
  repo: string;
}

// Helper to render Slack-style formatting as HTML
export function renderSlackFormatting(text: string): string {
  if (!text) return "";
  // Bold: *text*
  text = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  // Italic: _text_
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");
  // Strikethrough: ~text~
  //   text = text.replace(/~(.*?)~/g, "<s>$1</s>");
  // Inline code: `code`
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>'
  );
  // (Optional) Links: <http://url|text>
  text = text.replace(
    /<([^|>]+)\|([^>]+)>/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-700">$2</a>'
  );
  return text;
}

// New: RecentDigestDropdown component for a single digest
export function RecentDigestDropdown({
  digest,
  repo,
}: {
  digest: Digest | null;
  repo?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const SUMMARY_LIMIT = 160;
  const [expandedDigestId, setExpandedDigestId] = useState<string | null>(null);
  if (!digest) return null;
  const isLong = digest.summary && digest.summary.length > SUMMARY_LIMIT;
  const isExpanded = expandedDigestId === digest.id;
  const displaySummary =
    isLong && !isExpanded
      ? digest.summary.slice(0, SUMMARY_LIMIT) + "…"
      : digest.summary;
  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 mb-2"
        onClick={() => setExpanded((e) => !e)}>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        Recent Digest
      </Button>
      {expanded && (
        <Card className="p-3 bg-slate-50 border border-slate-200">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2 transition-all duration-150 hover:shadow-md">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      digest.status === "success"
                        ? "bg-green-100 text-green-700"
                        : digest.status === "failure"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                    }>
                    {digest.status.charAt(0).toUpperCase() +
                      digest.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {new Date(digest.delivered_at).toLocaleString()}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {digest.delivery_method}
                  </Badge>
                </div>
                <div className="font-bold text-blue-700 mb-1 flex items-center gap-2">
                  <span role="img" aria-label="digest">
                    📊
                  </span>{" "}
                  Daily Digest: {repo}
                </div>
                {digest.metrics_json && (
                  <div className="mb-2 text-xs text-slate-600 flex flex-wrap gap-3">
                    <span>
                      PRs opened: {digest.metrics_json.prs_opened ?? 0}
                    </span>
                    <span>
                      PRs closed: {digest.metrics_json.prs_closed ?? 0}
                    </span>
                    <span>
                      Issues opened: {digest.metrics_json.issues_opened ?? 0}
                    </span>
                    <span>
                      Issues closed: {digest.metrics_json.issues_closed ?? 0}
                    </span>
                    {digest.metrics_json.bugfixes &&
                      Array.isArray(digest.metrics_json.bugfixes) &&
                      digest.metrics_json.bugfixes.length > 0 && (
                        <span>
                          🐛 Bugfixes: {digest.metrics_json.bugfixes.length}
                        </span>
                      )}
                    {digest.metrics_json.docs &&
                      Array.isArray(digest.metrics_json.docs) &&
                      digest.metrics_json.docs.length > 0 && (
                        <span>📝 Docs: {digest.metrics_json.docs.length}</span>
                      )}
                    {digest.metrics_json.features &&
                      Array.isArray(digest.metrics_json.features) &&
                      digest.metrics_json.features.length > 0 && (
                        <span>
                          ✨ Features: {digest.metrics_json.features.length}
                        </span>
                      )}
                    {digest.metrics_json.refactors &&
                      Array.isArray(digest.metrics_json.refactors) &&
                      digest.metrics_json.refactors.length > 0 && (
                        <span>
                          ♻️ Refactors: {digest.metrics_json.refactors.length}
                        </span>
                      )}
                    {digest.metrics_json.perf &&
                      Array.isArray(digest.metrics_json.perf) &&
                      digest.metrics_json.perf.length > 0 && (
                        <span>⚡️ Perf: {digest.metrics_json.perf.length}</span>
                      )}
                  </div>
                )}
                <div className="text-slate-700 break-words">
                  {displaySummary ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: renderSlackFormatting(displaySummary),
                      }}
                    />
                  ) : (
                    <span className="text-slate-400 italic">No summary</span>
                  )}
                  {isLong && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-2 px-1 py-0 h-auto text-xs"
                      onClick={() =>
                        setExpandedDigestId(isExpanded ? null : digest.id)
                      }>
                      {isExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>
                {digest.status === "failure" && digest.error_message && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">
                      {digest.error_message || "Failed to deliver"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export const MonitorDigestHistory = ({
  monitorId,
  repo,
}: MonitorDigestHistoryProps) => {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const SUMMARY_LIMIT = 160;
  const [expandedDigestId, setExpandedDigestId] = useState<string | null>(null);

  const fetchDigests = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/monitor/${monitorId}/digests`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDigests(data.digests || []);
      } else {
        setDigests([]);
      }
    } catch (e) {
      setDigests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) fetchDigests();
    // eslint-disable-next-line
  }, [expanded]);

  const handleRetry = async (digestId: string) => {
    setRetryingId(digestId);
    // TODO: Implement retry endpoint and logic
    setTimeout(() => setRetryingId(null), 1000);
  };

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 mb-2"
        onClick={() => setExpanded((e) => !e)}>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        Recent Digests
      </Button>
      {expanded && (
        <Card className="p-3 bg-slate-50 border border-slate-200">
          {loading ? (
            <div>Loading digests…</div>
          ) : digests.length === 0 ? (
            <div className="text-slate-500">No digests found.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {digests.map((digest, idx) => {
                const isLong =
                  digest.summary && digest.summary.length > SUMMARY_LIMIT;
                const isExpanded = expandedDigestId === digest.id;
                const displaySummary =
                  isLong && !isExpanded
                    ? digest.summary.slice(0, SUMMARY_LIMIT) + "…"
                    : digest.summary;
                return (
                  <div key={digest.id} className="w-full">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2 transition-all duration-150 hover:shadow-md">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            digest.status === "success"
                              ? "bg-green-100 text-green-700"
                              : digest.status === "failure"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }>
                          {digest.status.charAt(0).toUpperCase() +
                            digest.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(digest.delivered_at).toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {digest.delivery_method}
                        </Badge>
                      </div>
                      {/* Digest header */}
                      <div className="font-bold text-blue-700 mb-1 flex items-center gap-2">
                        <span role="img" aria-label="digest">
                          📊
                        </span>{" "}
                        Daily Digest: {repo}
                      </div>
                      {/* Metrics display */}
                      {digest.metrics_json && (
                        <div className="mb-2 text-xs text-slate-600 flex flex-wrap gap-3">
                          <span>
                            PRs opened: {digest.metrics_json.prs_opened ?? 0}
                          </span>
                          <span>
                            PRs closed: {digest.metrics_json.prs_closed ?? 0}
                          </span>
                          <span>
                            Issues opened:{" "}
                            {digest.metrics_json.issues_opened ?? 0}
                          </span>
                          <span>
                            Issues closed:{" "}
                            {digest.metrics_json.issues_closed ?? 0}
                          </span>
                          {digest.metrics_json.bugfixes &&
                            (Array.isArray(digest.metrics_json.bugfixes)
                              ? digest.metrics_json.bugfixes.length > 0
                              : false) && (
                              <span>
                                🐛 Bugfixes:{" "}
                                {Array.isArray(digest.metrics_json.bugfixes)
                                  ? digest.metrics_json.bugfixes.length
                                  : 0}
                              </span>
                            )}
                          {digest.metrics_json.docs &&
                            (Array.isArray(digest.metrics_json.docs)
                              ? digest.metrics_json.docs.length > 0
                              : false) && (
                              <span>
                                📝 Docs:{" "}
                                {Array.isArray(digest.metrics_json.docs)
                                  ? digest.metrics_json.docs.length
                                  : 0}
                              </span>
                            )}
                          {digest.metrics_json.features &&
                            (Array.isArray(digest.metrics_json.features)
                              ? digest.metrics_json.features.length > 0
                              : false) && (
                              <span>
                                ✨ Features:{" "}
                                {Array.isArray(digest.metrics_json.features)
                                  ? digest.metrics_json.features.length
                                  : 0}
                              </span>
                            )}
                          {digest.metrics_json.refactors &&
                            (Array.isArray(digest.metrics_json.refactors)
                              ? digest.metrics_json.refactors.length > 0
                              : false) && (
                              <span>
                                ♻️ Refactors:{" "}
                                {Array.isArray(digest.metrics_json.refactors)
                                  ? digest.metrics_json.refactors.length
                                  : 0}
                              </span>
                            )}
                          {digest.metrics_json.perf &&
                            (Array.isArray(digest.metrics_json.perf)
                              ? digest.metrics_json.perf.length > 0
                              : false) && (
                              <span>
                                ⚡️ Perf:{" "}
                                {Array.isArray(digest.metrics_json.perf)
                                  ? digest.metrics_json.perf.length
                                  : 0}
                              </span>
                            )}
                        </div>
                      )}
                      <div
                        className="text-sm text-slate-800 whitespace-pre-line break-words"
                        style={{ wordBreak: "break-word" }}>
                        {displaySummary ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderSlackFormatting(displaySummary),
                            }}
                          />
                        ) : (
                          <span className="text-slate-400 italic">
                            No summary
                          </span>
                        )}
                        {isLong && (
                          <Button
                            variant="link"
                            size="sm"
                            className="ml-2 px-1 py-0 h-auto text-xs"
                            onClick={() =>
                              setExpandedDigestId(isExpanded ? null : digest.id)
                            }>
                            {isExpanded ? "Show less" : "Show more"}
                          </Button>
                        )}
                      </div>
                      {digest.status === "failure" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">
                            {digest.error_message || "Failed to deliver"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(digest.id)}
                            disabled={retryingId === digest.id}>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {retryingId === digest.id ? "Retrying…" : "Retry"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {idx < digests.length - 1 && (
                      <div className="my-2 border-t border-slate-100" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
