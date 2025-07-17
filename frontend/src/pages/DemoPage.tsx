import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Zap,
  MessageSquare,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatSlackToHtml } from "@/lib/slack-formatter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface DemoResponse {
  success: boolean;
  message: string;
  summary: string;
  repo_name: string;
  delivery_status: string;
}

const DemoPage = () => {
  const [repo, setRepo] = useState("facebook/react");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTryDemo = async () => {
    if (!repo) {
      setError("Please enter a repository");
      return;
    }

    if (!webhookUrl) {
      setError("Please enter a Slack webhook URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        repo,
        delivery_method: "slack",
        webhook_url: webhookUrl,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/digest/try`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send demo digest");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Try Infrasync Instantly
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Send a Demo Digest Right Now
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Experience the power of AI-powered repository summaries without
            setting up monitoring. This demo won't affect your metrics or
            history.
          </p>
        </div>

        {/* Demo Form */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold">Demo Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="repo">Repository</Label>
                  <Input
                    id="repo"
                    placeholder="owner/repo (e.g., facebook/react)"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Enter any public GitHub repository
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhook">Slack Webhook URL</Label>
                  <Input
                    id="webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Get this from your Slack app settings
                  </p>
                </div>

                {/* Coming Soon Options */}
                <div className="space-y-2">
                  <Label>Other Delivery Methods</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        Email Delivery
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        Discord Integration
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleTryDemo}
                  disabled={isLoading}
                  className="w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Demo Digest...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Send Demo Digest to Slack
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700">
                  🎯 Demo Mode - Won't affect metrics
                </Badge>
              </div>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {result && result.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">What You'll Get</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    AI-powered summary of recent activity
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Commit categorization (features, bugfixes, docs)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Pull request and issue summaries
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Direct links to GitHub</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    🎯 DEMO
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Marked as demo digest
                  </span>
                </div>
              </div>
            </Card>

            {/* Sample Output */}
            {result && result.summary && (
              <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold">Sample Output</h2>
                </div>
                <div
                  className="bg-slate-50 p-4 rounded-lg text-sm font-mono"
                  dangerouslySetInnerHTML={{
                    __html: formatSlackToHtml(result.summary),
                  }}
                />
              </Card>
            )}

            {/* Next Steps */}
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="font-semibold mb-3">
                Ready to set up real monitoring?
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Set up continuous monitoring with scheduled digests and full
                metrics tracking.
              </p>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full">
                Set Up Real Monitoring
              </Button>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12">
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">
              Need help setting up Slack webhooks?
            </h3>
            <div className="text-sm text-slate-600">
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your Slack workspace settings</li>
                <li>Create a new app or use an existing one</li>
                <li>Enable Incoming Webhooks</li>
                <li>Copy the webhook URL</li>
                <li>Paste it in the field above</li>
              </ol>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DemoPage;
