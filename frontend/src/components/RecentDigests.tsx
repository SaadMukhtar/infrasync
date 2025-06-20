
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle2, GitCommit, GitPullRequest, AlertCircle, ExternalLink } from "lucide-react";

export const RecentDigests = () => {
  const mockDigests = [
    {
      id: 1,
      repo: "facebook/react",
      date: "2024-12-18",
      status: "delivered",
      commits: 8,
      prs: 2,
      issues: 3,
      method: "slack"
    },
    {
      id: 2,
      repo: "facebook/react",
      date: "2024-12-11",
      status: "delivered",
      commits: 15,
      prs: 4,
      issues: 1,
      method: "slack"
    },
    {
      id: 3,
      repo: "facebook/react",
      date: "2024-12-04",
      status: "delivered",
      commits: 12,
      prs: 3,
      issues: 2,
      method: "slack"
    },
    {
      id: 4,
      repo: "facebook/react",
      date: "2024-11-27",
      status: "delivered",
      commits: 6,
      prs: 1,
      issues: 4,
      method: "slack"
    },
    {
      id: 5,
      repo: "facebook/react",
      date: "2024-11-20",
      status: "delivered",
      commits: 20,
      prs: 7,
      issues: 0,
      method: "slack"
    }
  ];

  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold">Recent Digests</h2>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {mockDigests.map((digest, index) => (
          <div key={digest.id}>
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium text-slate-800">{digest.repo}</div>
                    <div className="text-sm text-slate-500">{digest.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-blue-600" />
                    <span className="text-slate-600">{digest.commits}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitPullRequest className="w-3 h-3 text-emerald-600" />
                    <span className="text-slate-600">{digest.prs}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                    <span className="text-slate-600">{digest.issues}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Delivered
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {digest.method}
                </Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {index < mockDigests.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <div className="text-center text-sm text-slate-600">
          <p className="font-medium mb-1">Want to see more history?</p>
          <p>Upgrade to Pro to access digest analytics and unlimited history.</p>
          <Button variant="link" className="mt-2 p-0 h-auto">
            Learn more about Pro →
          </Button>
        </div>
      </div>
    </Card>
  );
};
