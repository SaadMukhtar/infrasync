import { useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Monitors } from "@/components/Monitors";
import { RepoInput } from "@/components/RepoInput";
import { DeliverySettings } from "@/components/DeliverySettings";
import { DigestPreview } from "@/components/DigestPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useAuth } from "@/hooks/useAuth";

const MonitorsPage = () => {
  const [currentRepo, setCurrentRepo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "slack" | "discord" | "email"
  >("slack");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "on_merge">(
    "daily"
  );
  const [webhook, setWebhook] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitorsKey, setMonitorsKey] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const { user } = useAuth();
  const { members, loading: membersLoading } = useOrgMembers();
  const currentMember = members.find((m) => m.user_id === user?.sub);
  const isViewer = currentMember?.role === "viewer";

  const handleSaveSettings = async () => {
    if (!currentRepo || !webhook) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        setMonitorsKey((k) => k + 1);
        toast?.({
          title: "Monitoring started!",
          description: "Your repo is now being monitored.",
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        {/* Monitor Creation Form */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Repository Setup</h2>
              </div>
              <RepoInput
                value={currentRepo}
                onChange={setCurrentRepo}
                disabled={isViewer}
              />
            </Card>
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Delivery Settings</h2>
              </div>
              <DeliverySettings
                method={deliveryMethod}
                frequency={frequency}
                webhook={webhook}
                onMethodChange={setDeliveryMethod}
                onFrequencyChange={setFrequency}
                onWebhookChange={setWebhook}
                disabled={isViewer}
              />
            </Card>
            <div className="flex justify-center">
              <Button
                onClick={handleSaveSettings}
                disabled={isViewer || !currentRepo || !webhook || loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105">
                {loading ? "Adding…" : "Add Monitor"}
              </Button>
              {isViewer && (
                <div className="text-center text-slate-500 text-sm mt-2">
                  Viewers cannot add monitors. Ask an admin to upgrade your
                  role.
                </div>
              )}
            </div>
            {error && (
              <div className="text-center text-red-600 text-sm">{error}</div>
            )}
            {isConfigured && (
              <div className="text-center">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700">
                  ✓ Repository monitoring active
                </Badge>
              </div>
            )}
          </div>
          <div>
            <DigestPreview
              deliveryMethod={deliveryMethod}
              repoName={currentRepo || "facebook/react"}
            />
          </div>
        </div>
        {/* Monitors List */}
        <Monitors key={monitorsKey} />
      </main>
      <Footer />
    </div>
  );
};

export default MonitorsPage;
