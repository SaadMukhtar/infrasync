import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GitBranch,
  Bell,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const Onboarding = () => {
  const { user, needsOrgSetup, loading, error: authError, logout } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Redirect logic: if user is in an org, go home; if not authenticated, go login
  useEffect(() => {
    if (loading) return;
    // Only redirect to login if user is truly unauthenticated
    if (authError === "Not authenticated" || (!user && !loading)) {
      navigate("/login", { replace: true });
      return;
    }
    // Only redirect to root if user does not need onboarding
    if (user && !needsOrgSetup) {
      navigate("/", { replace: true });
      return;
    }
    // else: show onboarding
  }, [user, needsOrgSetup, loading, authError, navigate]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: orgName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create org");

      // Set JWT cookie via secure endpoint
      await fetch(`${API_BASE_URL}/api/v1/auth/set-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.jwt }),
        credentials: "include",
      });

      setSuccess(`Organization "${data.name}" created! Redirecting...`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create organization");
      } else {
        setError("Failed to create organization");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to join org");

      // Set JWT cookie via secure endpoint
      await fetch(`${API_BASE_URL}/api/v1/auth/set-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.jwt }),
        credentials: "include",
      });

      setSuccess(`Joined organization "${data.name}"! Redirecting...`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to join organization");
      } else {
        setError("Failed to join organization");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBackToHome = async () => {
    try {
      await logout(true); // Skip reload to prevent redirect issues
      navigate("/");
    } catch (error) {
      // console.error("Error logging out:", error);
      // Still navigate to home even if logout fails
      navigate("/");
    }
  };

  // Only show onboarding if user needsOrgSetup is true
  if (loading || (user && !needsOrgSetup)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50">
            <ArrowLeft className="w-4 h-4" />
            Back to Home & Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Welcome & Features */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="secondary" className="text-sm">
                  Welcome to Infrasync
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Monitor your GitHub repos
                <span className="text-blue-600"> with confidence</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Get real-time insights into your GitHub repositories and code
                changes. Stay ahead of issues before they impact your team.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg border border-white/20">
                <GitBranch className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Repository Monitoring
                  </h3>
                  <p className="text-sm text-gray-600">
                    Track changes across all your repos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg border border-white/20">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Smart Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Slack, Discord, and Email alerts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg border border-white/20">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Self-Hostable</h3>
                  <p className="text-sm text-gray-600">
                    Open source, deploy anywhere
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg border border-white/20">
                <Zap className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Code Change Tracking
                  </h3>
                  <p className="text-sm text-gray-600">
                    Monitor commits, PRs, and releases
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Setup Forms */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Get Started
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Create your organization or join an existing team
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => setActiveTab("create")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === "create"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}>
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Create Organization
                  </button>
                  <button
                    onClick={() => setActiveTab("join")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === "join"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}>
                    <Users className="w-4 h-4 inline mr-2" />
                    Join Team
                  </button>
                </div>

                {/* Create Organization Form */}
                {activeTab === "create" && (
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Organization Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter organization name..."
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        disabled={loadingAction}
                        required
                        className="h-12 text-base"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={loadingAction || !orgName.trim()}>
                      {loadingAction ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Create Organization
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Join Organization Form */}
                {activeTab === "join" && (
                  <form onSubmit={handleJoinOrg} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Invite Code
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter invite code..."
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        disabled={loadingAction}
                        required
                        className="h-12 text-base"
                      />
                      <p className="text-xs text-gray-500">
                        Ask your team admin for the invite code
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50"
                      disabled={loadingAction || !inviteCode.trim()}>
                      {loadingAction ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                          Joining...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Join Organization
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <div className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center">
                        <span className="text-xs font-bold">!</span>
                      </div>
                      {error}
                    </div>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      {success}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="text-center text-sm text-gray-500">
              <p className="text-xs text-gray-500 text-center mt-6">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                ,{" "}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link to="/cookies" className="text-blue-600 hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
