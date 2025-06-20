import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slack, MessageSquare, Mail, Clock } from "lucide-react";

interface DeliverySettingsProps {
  method: "slack" | "discord" | "email";
  frequency: "daily" | "weekly" | "on_merge";
  webhook: string;
  onMethodChange: (method: "slack" | "discord" | "email") => void;
  onFrequencyChange: (frequency: "daily" | "weekly" | "on_merge") => void;
  onWebhookChange: (webhook: string) => void;
  disabled?: boolean;
}

export const DeliverySettings = ({
  method,
  frequency,
  webhook,
  onMethodChange,
  onFrequencyChange,
  onWebhookChange,
  disabled = false,
}: DeliverySettingsProps) => {
  const deliveryMethods = [
    { id: "slack", label: "Slack", icon: Slack, color: "text-purple-600" },
    {
      id: "discord",
      label: "Discord",
      icon: MessageSquare,
      color: "text-indigo-600",
    },
    { id: "email", label: "Email", icon: Mail, color: "text-blue-600" },
  ];

  const frequencies = [
    { id: "daily", label: "Daily", description: "Every day at 13:00 UTC" },
    { id: "weekly", label: "Weekly", description: "Every Monday at 13:00 UTC" },
    {
      id: "on_merge",
      label: "On PR Merge",
      description: "When pull requests are merged",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Delivery Method */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Delivery Method
        </Label>
        <RadioGroup
          value={method}
          onValueChange={(value) =>
            onMethodChange(value as "slack" | "discord" | "email")
          }
          className="space-y-2"
          disabled={disabled}>
          {deliveryMethods.map(({ id, label, icon: Icon, color }) => (
            <div
              key={id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem
                value={id}
                id={id}
                // disabled={id === "discord" || id === "email"}
              />
              <Icon className={`w-5 h-5 ${color}`} />
              <Label htmlFor={id} className="flex-1 cursor-pointer font-medium">
                {label}
              </Label>
              {method === id && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700">
                  Selected
                </Badge>
              )}
              {["discord", "email"].includes(id) && frequency !== id && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700">
                  Coming Soon
                </Badge>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Connection Details */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          {method === "slack" && "Slack Webhook URL"}
          {method === "discord" && "Discord Webhook URL"}
          {method === "email" && "Email Address"}
        </Label>
        <Input
          value={webhook}
          onChange={(e) => onWebhookChange(e.target.value)}
          placeholder={
            method === "slack"
              ? "https://hooks.slack.com/services/..."
              : method === "discord"
              ? "https://discord.com/api/webhooks/..."
              : "your@email.com"
          }
          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          disabled={disabled || method === "discord" || method === "email"}
        />
      </div>

      {/* Frequency */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Update Frequency
        </Label>
        <RadioGroup
          value={frequency}
          onValueChange={(value) =>
            onFrequencyChange(value as "daily" | "weekly" | "on_merge")
          }
          className="space-y-2"
          disabled={disabled}>
          {frequencies.map(({ id, label, description }) => (
            <div
              key={id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <RadioGroupItem
                value={id}
                id={`freq-${id}`}
                disabled={id === "weekly" || id === "on_merge"}
              />
              <div className="flex-1">
                <Label
                  htmlFor={`freq-${id}`}
                  className="cursor-pointer font-medium">
                  {label}
                </Label>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              {frequency === id && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700">
                  Active
                </Badge>
              )}
              {["weekly", "on_merge"].includes(id) && frequency !== id && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700">
                  Coming Soon
                </Badge>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};
