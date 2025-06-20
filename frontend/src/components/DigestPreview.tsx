import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface DigestPreviewProps {
  deliveryMethod: "slack" | "discord" | "email";
  repoName: string;
}

export const DigestPreview = ({
  deliveryMethod,
  repoName,
}: DigestPreviewProps) => {
  const mockData = {
    commits: 12,
    pullRequests: 4,
    issuesOpened: 0,
    issuesClosed: 1,
    date: "Dec 18, 2024",
    highlights: {
      bugfixes: ["Resolved admin role mismatch issue"],
      features: ["Enabled 2FA and dark mode settings"],
      refactors: ["Modularized auth and simplified queries"],
      docs: ["Enhanced README and contribution guide"],
      performance: ["Improved gallery image rendering speed"],
    },
  };

  const SlackPreview = () => (
    <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
          I
        </div>
        <span className="font-bold">Infrasync</span>
        <span className="text-slate-500 text-xs">Today at 9:00 AM</span>
      </div>

      <div className="bg-white p-4 rounded border-l-4 border-l-blue-500">
        <h3 className="font-bold text-slate-800 mb-2">
          📊 Daily Digest: {repoName}
        </h3>

        <div className="space-y-2 text-sm">
          <div>
            🔀 {mockData.pullRequests} PRs opened, {mockData.pullRequests}{" "}
            closed
          </div>
          <div>
            ✨ {mockData.issuesOpened} issues opened, {mockData.issuesClosed}{" "}
            closed
          </div>
        </div>

        <Separator className="my-3" />

        <div className="text-sm text-slate-600">
          <p>
            <strong>🔥 Highlights:</strong>
          </p>
          <ul className="list-disc ml-4 mt-1 space-y-2">
            <li>
              <strong>🐛 Bugfixes:</strong>
              <ul className="ml-4 list-disc">
                {mockData.highlights.bugfixes.map((item, idx) => (
                  <li key={`bugfix-${idx}`}>{item}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>✨ Features:</strong>
              <ul className="ml-4 list-disc">
                {mockData.highlights.features.map((item, idx) => (
                  <li key={`feature-${idx}`}>{item}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>♻️ Refactors:</strong>
              <ul className="ml-4 list-disc">
                {mockData.highlights.refactors.map((item, idx) => (
                  <li key={`refactor-${idx}`}>{item}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>📝 Docs:</strong>
              <ul className="ml-4 list-disc">
                {mockData.highlights.docs.map((item, idx) => (
                  <li key={`docs-${idx}`}>{item}</li>
                ))}
              </ul>
            </li>
            <li>
              <strong>⚡️ Performance:</strong>
              <ul className="ml-4 list-disc">
                {mockData.highlights.performance.map((item, idx) => (
                  <li key={`perf-${idx}`}>{item}</li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const EmailPreview = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-4">
        <h3 className="font-bold text-lg">Weekly Repository Digest</h3>
        <p className="text-blue-100 text-sm">
          {repoName} • {mockData.date}
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {mockData.commits}
            </div>
            <div className="text-sm text-slate-600">Commits</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">
              {mockData.pullRequests}
            </div>
            <div className="text-sm text-slate-600">PRs Merged</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {mockData.issuesOpened}
            </div>
            <div className="text-sm text-slate-600">Issues</div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-slate-800 mb-2">
            🚀 Recent Activity
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-2 bg-slate-50 rounded">
              <GitCommit className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium">
                  feat: Add user authentication system
                </div>
                <div className="text-slate-500">by @johndoe • 2 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-slate-50 rounded">
              <GitPullRequest className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-medium">
                  Merge pull request #247 from feature/dark-mode
                </div>
                <div className="text-slate-500">by @janedoe • 5 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DiscordPreview = () => (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
          I
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Infrasync</span>
            <Badge
              variant="secondary"
              className="text-xs bg-indigo-600 text-white">
              BOT
            </Badge>
          </div>
          <span className="text-gray-400 text-xs">Today at 9:00 AM</span>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded border-l-4 border-l-indigo-500">
        <h3 className="font-bold text-white mb-2">
          📈 {repoName} Weekly Summary
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-600 p-2 rounded text-center">
            <div className="text-lg font-bold">{mockData.commits}</div>
            <div className="text-xs">Commits</div>
          </div>
          <div className="bg-emerald-600 p-2 rounded text-center">
            <div className="text-lg font-bold">{mockData.pullRequests}</div>
            <div className="text-xs">PRs</div>
          </div>
          <div className="bg-orange-600 p-2 rounded text-center">
            <div className="text-lg font-bold">{mockData.issuesOpened}</div>
            <div className="text-xs">Issues</div>
          </div>
        </div>

        <div className="text-sm text-gray-300">
          <p className="font-semibold">🔍 AI Summary:</p>
          <p className="mt-1">
            This week saw significant progress with performance optimizations
            and security improvements. The team merged 3 major features
            including dark mode support.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold">Digest Preview</h2>
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 capitalize">
          {deliveryMethod}
        </Badge>
      </div>

      <div className="space-y-4">
        {deliveryMethod === "slack" && <SlackPreview />}
        {deliveryMethod === "email" && <EmailPreview />}
        {deliveryMethod === "discord" && <DiscordPreview />}

        <div className="text-xs text-slate-500 text-center mt-4">
          Preview based on mock data • Actual digests will include real
          repository activity
        </div>
      </div>
    </Card>
  );
};
