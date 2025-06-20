import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useState } from "react";

const demoDigests = [
  {
    id: "d1",
    summary:
      "*AI Summary*: Fixed bug in `useSync` hook. See <https://github.com/facebook/react/pull/12345|PR #12345>.",
    status: "success",
    delivered_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    delivery_method: "slack",
  },
  {
    id: "d2",
    summary: "_Chore_: Updated dependencies. No breaking changes.",
    status: "success",
    delivered_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    delivery_method: "slack",
  },
  {
    id: "d3",
    summary: "Failed to deliver digest due to invalid webhook URL.",
    status: "failure",
    delivered_at: new Date(Date.now() - 10800 * 1000).toISOString(),
    delivery_method: "slack",
    error_message: "Webhook not found.",
  },
];

function renderSlackFormatting(text: string): string {
  if (!text) return "";
  text = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");
  text = text.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>'
  );
  text = text.replace(
    /<([^|>]+)\|([^>]+)>/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-blue-700">$2</a>'
  );
  return text;
}

const DemoMonitorDigestHistory = ({
  monitorId,
  repo,
}: {
  monitorId: string;
  repo: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedDigestId, setExpandedDigestId] = useState<string | null>(null);
  const SUMMARY_LIMIT = 160;

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
          <div className="flex flex-col gap-4">
            {demoDigests.map((digest, idx) => {
              const isLong =
                digest.summary && digest.summary.length > SUMMARY_LIMIT;
              const isExpanded = expandedDigestId === digest.id;
              const displaySummary =
                isLong && !isExpanded
                  ? digest.summary.slice(0, SUMMARY_LIMIT) + "…"
                  : digest.summary;
              return (
                <div key={digest.id} className="w-full">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2 transition-all duration-150 hover:shadow-md relative">
                    <span className="absolute top-2 right-2 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      Demo Data
                    </span>
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
                          title="Sign up to retry!"
                          disabled>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                  {idx < demoDigests.length - 1 && (
                    <div className="my-2 border-t border-slate-100" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DemoMonitorDigestHistory;
