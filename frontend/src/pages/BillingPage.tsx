// Usage: Add a <Route path="/billing" element={<BillingPage />} /> to your router to access this page.
import React from "react";
import { useBilling } from "@/hooks/useBilling";
import { useAuth } from "@/hooks/useAuth";
import { useMonitors } from "@/hooks/useMonitors";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const PLAN_FEATURES = [
  { plan: "Free", max_repos: 1, repositories: 1, price: "$0/mo" },
  { plan: "Pro", max_repos: 5, repositories: 5, price: "$4/mo" },
  { plan: "Team", max_repos: 10, repositories: 10, price: "$9/mo" },
];

function hasMaxRepos(limits: unknown): limits is { max_repos: number } {
  return (
    typeof limits === "object" &&
    limits !== null &&
    "max_repos" in limits &&
    typeof (limits as { max_repos: unknown }).max_repos === "number"
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const orgId = user?.org_id || "";
  const isAdmin = user?.role === "admin";
  const { status, loading, error, refetch } = useBilling(orgId);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  const { monitors } = useMonitors();
  const monitorCount = monitors.length;
  const [upgradeLoading, setUpgradeLoading] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.search.includes("billing=success")) {
      // First refresh the billing status from Stripe
      fetch(`${API_BASE_URL}/api/v1/billing/refresh?org_id=${orgId}`, {
        method: "POST",
        credentials: "include",
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            // console.error("Billing refresh error:", text);
            throw new Error("Failed to refresh billing status");
          }
          return res.json();
        })
        .then((data) => {
          refetch();
          toast({
            title: "Billing updated!",
            description: `Your plan has been updated to ${data.plan}.`,
            variant: "default",
          });
        })
        .catch((err) => {
          // console.error("Error refreshing billing:", err);
          // Still refetch in case the webhook worked
          refetch();
          toast({
            title: "Billing updated!",
            description: "Your plan has been updated.",
            variant: "default",
          });
        });
      navigate("/billing", { replace: true });
    } else if (location.search.includes("billing=portal_return")) {
      // Refresh billing status when returning from portal
      fetch(`${API_BASE_URL}/api/v1/billing/refresh?org_id=${orgId}`, {
        method: "POST",
        credentials: "include",
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            // console.error("Billing refresh error:", text);
            throw new Error("Failed to refresh billing status");
          }
          return res.json();
        })
        .then((data) => {
          refetch();
          toast({
            title: "Billing updated!",
            description: `Your plan has been updated to ${data.plan}.`,
            variant: "default",
          });
        })
        .catch((err) => {
          // console.error("Error refreshing billing from portal:", err);
          // Still refetch in case the webhook worked
          refetch();
          toast({
            title: "Billing updated!",
            description: "Your plan has been updated.",
            variant: "default",
          });
        });
      navigate("/billing", { replace: true });
    } else if (location.search.includes("billing=cancel")) {
      refetch();
      toast({
        title: "Billing cancelled",
        description: "No changes were made to your plan.",
        variant: "default",
      });
      navigate("/billing", { replace: true });
    }
  }, [location.search, refetch, navigate, orgId, API_BASE_URL]);

  const plan = status?.plan ?? "";
  const limits = status?.limits;
  const maxRepos = hasMaxRepos(limits) ? limits.max_repos : 1;
  const atLimit = monitorCount >= maxRepos;
  const isUnlimited = status?.is_internal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <h1 className="text-3xl font-bold mb-2">Billing & Plan</h1>
        <div className="mb-6 text-gray-600">
          Manage your subscription, view usage, and upgrade your plan.
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          {loading ? (
            <div className="text-sm text-gray-400">Loading billing info…</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : !status ? (
            <div className="text-sm text-gray-400">
              Unable to load billing info.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    Current Plan:{" "}
                    {status.plan === "pro" ? (
                      <span className="flex items-center gap-2">
                        <span className="capitalize bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          Pro
                        </span>
                        <span className="text-blue-600 text-sm font-medium">
                          ✓ More Monitors
                        </span>
                      </span>
                    ) : status.plan === "team" ? (
                      <span className="flex items-center gap-2">
                        <span className="capitalize bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          Team
                        </span>
                        <span className="text-indigo-600 text-sm font-medium">
                          ✓ Enterprise Support
                        </span>
                      </span>
                    ) : (
                      <span className="capitalize text-gray-600">
                        {status.plan}
                      </span>
                    )}
                    {status.is_internal && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                        Internal Org: Unlimited Usage
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {status.plan === "pro" ? (
                      <span className="text-blue-600 font-medium">
                        More monitors and repos for your growing infrastructure
                      </span>
                    ) : status.plan === "team" ? (
                      <span className="text-indigo-600 font-medium">
                        Enterprise support and unlimited scale for your team
                      </span>
                    ) : hasMaxRepos(status.limits) &&
                      monitorCount >= status.limits.max_repos &&
                      !status.is_internal ? (
                      "You've reached your plan limit."
                    ) : status.is_internal ? (
                      "Unlimited monitors, integrations, and members."
                    ) : (
                      "Upgrade for more monitors and repos as you scale."
                    )}
                  </div>
                </div>
                {isAdmin && !status.is_internal && (
                  <div className="flex gap-2">
                    <Button
                      className="btn btn-primary"
                      aria-label="Manage Plan"
                      disabled={portalLoading}
                      onClick={async () => {
                        setPortalLoading(true);
                        try {
                          const res = await fetch(
                            `${API_BASE_URL}/api/v1/billing/create-portal-session?org_id=${orgId}`,
                            {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                            }
                          );
                          const data = await res.json();
                          if (data?.url) window.location.href = data.url;
                        } finally {
                          setPortalLoading(false);
                        }
                      }}>
                      {portalLoading ? "Loading..." : "Manage Plan"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Simple Plan Benefits */}
              {(status.plan === "pro" || status.plan === "team") && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {status.plan === "pro" ? "Pro Plan" : "Team Plan"}
                  </h3>
                  <div className="text-sm text-blue-800">
                    {status.plan === "pro" ? (
                      <div className="space-y-1">
                        <div>• More monitors and repositories</div>
                        <div>• Reliable hosted infrastructure</div>
                        <div>• Community support</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div>• Unlimited monitors and repositories</div>
                        <div>• Enterprise support and SLAs</div>
                        <div>• Dedicated infrastructure</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="font-semibold mb-1 flex items-center gap-1">
                  Delivery Monitors
                  <span
                    aria-label="Number of delivery channels (Slack, Discord, Email, etc.) you can set up."
                    title="Number of delivery channels (Slack, Discord, Email, etc.) you can set up.">
                    <Info className="w-4 h-4 text-blue-400" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                    <div
                      className={
                        isUnlimited
                          ? "bg-gradient-to-r from-green-400 to-green-600 h-3 rounded"
                          : status.plan === "pro"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded"
                          : status.plan === "team"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded"
                          : "bg-blue-500 h-3 rounded"
                      }
                      style={{
                        width: isUnlimited
                          ? "100%"
                          : `${Math.min(
                              100,
                              (monitorCount / maxRepos) * 100
                            )}%`,
                      }}
                      aria-label="Usage Progress"
                    />
                  </div>
                  <div className="text-xs text-gray-600 min-w-fit">
                    {isUnlimited
                      ? "Unlimited"
                      : `${monitorCount} / ${maxRepos}`}
                  </div>
                </div>
              </div>
              <div className="mb-2 text-xs text-gray-500">
                Billing is managed securely via Stripe. You can view invoices
                and manage your subscription in the portal.
              </div>
              {/* Placeholder for Stripe status, renewal date, invoices */}
              <div className="text-xs text-gray-400">
                (Stripe status, renewal date, and invoice history coming soon)
              </div>
            </>
          )}
        </div>
        <h2 className="text-xl font-bold mb-2">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm bg-white rounded-xl shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left font-semibold">Plan</th>
                <th className="p-3 text-left font-semibold">
                  Delivery Monitors
                </th>
                <th className="p-3 text-left font-semibold">Repositories</th>
                <th className="p-3 text-left font-semibold">Price</th>
                <th className="p-3 text-left font-semibold">What You Get</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((f) => (
                <tr
                  key={f.plan}
                  className={
                    plan === f.plan.toLowerCase()
                      ? f.plan.toLowerCase() === "pro"
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 font-semibold"
                        : f.plan.toLowerCase() === "team"
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 font-semibold"
                        : "bg-blue-50 border-2 border-blue-200 font-semibold"
                      : "hover:bg-gray-50"
                  }>
                  <td className="p-3 font-semibold">{f.plan}</td>
                  <td className="p-3">
                    {isUnlimited
                      ? "Unlimited"
                      : typeof f.max_repos === "number"
                      ? f.max_repos
                      : "-"}
                  </td>
                  <td className="p-3">
                    {isUnlimited ? "Unlimited" : f.repositories}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        f.plan.toLowerCase() === "pro"
                          ? "text-blue-600 font-bold"
                          : ""
                      }>
                      {f.price}
                    </span>
                  </td>
                  <td className="p-3">
                    {f.plan.toLowerCase() === "free" && (
                      <span className="text-xs text-gray-600">
                        Perfect for small projects
                      </span>
                    )}
                    {f.plan.toLowerCase() === "pro" && (
                      <span className="text-xs text-blue-600 font-medium">
                        Scale as you grow
                      </span>
                    )}
                    {f.plan.toLowerCase() === "team" && (
                      <span className="text-xs text-indigo-600 font-medium">
                        Enterprise support
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">💡 All plans include:</p>
          <ul className="space-y-1">
            <li>• GitHub repository monitoring</li>
            <li>• Slack, Discord, and Email notifications</li>
            <li>• Infrastructure insights and alerts</li>
            <li>• Self-hostable (open source)</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
