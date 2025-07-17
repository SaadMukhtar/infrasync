import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor as MonitorIcon } from "lucide-react";
import { useState } from "react";
import DemoMonitorDigestHistory from "./_DemoMonitorDigestHistory";

const demoMonitors = [
  {
    id: "1",
    repo: "facebook/react",
    delivery_method: "slack",
    frequency: "daily",
    is_private: false,
  },
  {
    id: "2",
    repo: "vercel/next.js",
    delivery_method: "discord",
    frequency: "daily",
    is_private: true,
  },
  {
    id: "3",
    repo: "microsoft/vscode",
    delivery_method: "email",
    frequency: "daily",
    is_private: false,
  },
];

const DemoMonitors = () => {
  const [actionMonitorId, setActionMonitorId] = useState<string | null>(null);
  return (
    <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MonitorIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">
            Your Monitors{" "}
            <Badge className="ml-2 bg-slate-200 text-slate-700">
              Demo Data
            </Badge>
          </h2>
        </div>
      </div>
      <div className="space-y-3">
        {demoMonitors.map((m) => (
          <div key={m.id}>
            <Card className="p-4 bg-white/80 shadow-lg hover:bg-slate-50 transition-colors rounded-lg flex flex-col gap-2 relative">
              <span className="absolute top-2 right-2 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                Demo Data
              </span>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-blue-700 truncate text-lg font-semibold">
                    {m.repo}
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
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActionMonitorId(m.id)}
                    title="Sign up to edit frequency!"
                    disabled>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setActionMonitorId(m.id)}
                    title="Sign up to delete!"
                    disabled>
                    Delete
                  </Button>
                </div>
              </div>
              <DemoMonitorDigestHistory monitorId={m.id} repo={m.repo} />
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DemoMonitors;
