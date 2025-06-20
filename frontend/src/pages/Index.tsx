
import { useState } from "react";
import { Header } from "@/components/Header";
import { RepoInput } from "@/components/RepoInput";
import { DeliverySettings } from "@/components/DeliverySettings";
import { DigestPreview } from "@/components/DigestPreview";
import { RecentDigests } from "@/components/RecentDigests";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Zap, Clock } from "lucide-react";

const Index = () => {
  const [currentRepo, setCurrentRepo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"slack" | "discord" | "email">("slack");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "on_merge">("weekly");
  const [isConfigured, setIsConfigured] = useState(false);

  const handleSaveSettings = () => {
    if (currentRepo) {
      setIsConfigured(true);
      console.log("Settings saved:", { currentRepo, deliveryMethod, frequency });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Repository Monitoring
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Stay in sync with your repo
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Get intelligent summaries of commits, pull requests, and issues delivered to your preferred platform—without reading every change.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5min</div>
              <div className="text-sm text-slate-500">Setup time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">AI-powered</div>
              <div className="text-sm text-slate-500">Summaries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-slate-500">Delivery methods</div>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
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
                onMethodChange={setDeliveryMethod}
                onFrequencyChange={setFrequency}
              />
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={handleSaveSettings}
                disabled={!currentRepo}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Start Monitoring
              </Button>
            </div>

            {isConfigured && (
              <div className="text-center">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
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

        {/* Recent Digests */}
        <RecentDigests />
      </main>
    </div>
  );
};

export default Index;
