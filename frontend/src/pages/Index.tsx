import { useState } from "react";
import { Header } from "@/components/Header";
import { RepoInput } from "@/components/RepoInput";
import { DeliverySettings } from "@/components/DeliverySettings";
import { DigestPreview } from "@/components/DigestPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Zap, Clock, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DemoMonitors from "./_DemoMonitors";
import { Link } from "react-router-dom";

const Index = () => {
  const [currentRepo, setCurrentRepo] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "slack" | "discord" | "email"
  >("slack");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "on_merge">(
    "daily"
  );
  const [webhook, setWebhook] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const { login } = useAuth();

  // Demo: Start Monitoring always triggers login
  const handleStartMonitoring = () => {
    login();
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
            Get intelligent summaries of commits, pull requests, and issues
            delivered to your preferred platform—without reading every change.
          </p>

          {/* Demo CTA */}
          <div className="flex justify-center gap-4 mb-12">
            <Link to="/demo">
              <Button
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105">
                <Play className="w-4 h-4 mr-2" />
                Try Demo Now
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 font-medium rounded-lg"
              onClick={login}>
              Sign Up Free
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5min</div>
              <div className="text-sm text-slate-500">Setup time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                AI-powered
              </div>
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
              <RepoInput value={currentRepo} onChange={setCurrentRepo} />
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
              />
            </Card>
            <div className="flex justify-center">
              <Button
                onClick={handleStartMonitoring}
                disabled={!currentRepo}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105">
                Start Monitoring
              </Button>
            </div>
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
        {/* Demo Monitors Section */}
        <DemoMonitors />
      </main>
      {/* Sticky Sign up CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 flex justify-center z-50 shadow-lg">
        <Button
          size="lg"
          className="bg-white text-blue-700 font-bold px-8 py-3 rounded-lg shadow hover:bg-slate-100"
          onClick={login}>
          Sign up / Login with GitHub
        </Button>
      </div>
    </div>
  );
};

export default Index;
