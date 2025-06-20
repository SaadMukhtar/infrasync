import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";

interface BillingStatusProps {
  orgId: string;
  monitorCount: number;
  plan: string;
  maxRepos: number | "unlimited";
  isInternal?: boolean;
}

export const BillingStatus: React.FC<BillingStatusProps> = ({
  orgId,
  monitorCount,
  plan,
  maxRepos,
  isInternal,
}) => {
  const usagePercent =
    maxRepos === "unlimited"
      ? 0
      : Math.min(100, (monitorCount / (maxRepos as number)) * 100);

  return (
    <Card className="p-4 flex flex-col gap-2 shadow rounded-xl border bg-white">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-5 h-5 text-blue-500" aria-label="Billing" />
        <span
          className="text-lg font-bold text-blue-700 capitalize"
          aria-label="Plan">
          {plan}
        </span>
        {isInternal && (
          <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
            Internal Org
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Delivery Monitors</span>
        <span className="text-sm">
          {monitorCount} / {isInternal ? "Unlimited" : maxRepos}
        </span>
      </div>
      {!isInternal && (
        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden mb-2">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${usagePercent}%` }}
            aria-label="Usage Progress"
          />
        </div>
      )}
      <Link
        to="/billing"
        className="inline-block mt-2 text-xs text-blue-600 hover:underline font-medium self-end"
        aria-label="View usage details">
        Usage Details →
      </Link>
    </Card>
  );
};
