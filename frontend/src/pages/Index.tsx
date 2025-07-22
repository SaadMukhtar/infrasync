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

          {/* Product Screenshot */}
          <div className="flex justify-center mb-12">
            <img
              src="/dashboard.png"
              alt="Infrasync dashboard screenshot"
              className="rounded-xl shadow-lg max-w-full h-auto border"
              style={{ maxHeight: 700 }}
            />
            <div className="w-10"></div>
            <img
              src="/monitor_metrics.png"
              alt="Infrasync dashboard screenshot"
              className="rounded-xl shadow-lg max-w-full h-auto border"
              style={{ maxHeight: 700 }}
            />
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center text-center">
              <Zap
                className="w-8 h-8 text-blue-600 mb-2"
                aria-label="AI-Powered Digests"
              />
              <div className="font-bold mb-1">AI-Powered Digests</div>
              <div className="text-slate-500 text-sm">
                Get GPT summaries of PRs, issues, and releases delivered to
                Slack, Discord, or email.
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <GitBranch
                className="w-8 h-8 text-emerald-600 mb-2"
                aria-label="Multi-Tenant & Secure"
              />
              <div className="font-bold mb-1">Multi-Tenant & Secure</div>
              <div className="text-slate-500 text-sm">
                Org-aware RBAC, GitHub OAuth, and secure cross-subdomain
                cookies.
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <Clock
                className="w-8 h-8 text-purple-600 mb-2"
                aria-label="Zero-Downtime Deploys"
              />
              <div className="font-bold mb-1">Zero-Downtime Deploys</div>
              <div className="text-slate-500 text-sm">
                Blue/green ECS, ALB health checks, and automated CI/CD for peace
                of mind.
              </div>
            </div>
          </div>
        </div>

        {/* Removed configuration section for first-time visitors */}
        {/* <div className="grid lg:grid-cols-2 gap-8 mb-12"> ... </div> */}
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
        {/* OSS/SaaS Badge and GitHub Star Button */}
        <div className="flex flex-col items-center mb-8">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 mb-2">
            Open Source & SaaS Ready
          </Badge>
          <a
            href="https://github.com/SaadMukhtar/infrasync"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium shadow hover:bg-slate-800 transition"
            aria-label="Star Infrasync on GitHub">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.568L24 9.423l-6 5.845L19.335 24 12 19.771 4.665 24 6 15.268 0 9.423l8.332-1.268z" />
            </svg>
            Star us on GitHub
          </a>
        </div>
        {/* Footer */}
        <footer className="mt-12 py-6 border-t bg-white/80 text-center text-slate-500 text-sm mb-12">
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <a
              href="https://github.com/SaadMukhtar/infrasync"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline">
              GitHub
            </a>
            <a href="/docs" className="hover:underline">
              Docs
            </a>
            <a href="/terms" className="hover:underline">
              Terms
            </a>
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>
            <a
              href="mailto:saadmukhtar01@gmail.com"
              className="hover:underline">
              Contact
            </a>
          </div>
          <div>
            © {new Date().getFullYear()} Infrasync. All rights reserved.
          </div>
        </footer>
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
