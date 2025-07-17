import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Building2,
  Copy,
  UserCheck,
  ArrowLeft,
  Edit,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InviteMemberModal } from "./InviteMemberModal";
import { MemberActions } from "./MemberActions";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface OrgInfo {
  id: string;
  name: string;
  created_at: string;
}

interface OrgMember {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  org_id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const OrgSettings = () => {
  const { user, refresh, logout } = useAuth();
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleCancelEdit = () => {
    setNewOrgName(orgInfo?.name || "");
    setEditingName(false);
  };

  const isAdmin =
    members.find((m) => m.user_id === user?.sub)?.role === "admin";

  const fetchOrgData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch org info
      const orgRes = await fetch(`${API_BASE_URL}/api/v1/org`, {
        credentials: "include",
      });
      if (orgRes.status === 401 || orgRes.status === 404) {
        toast?.({
          title: "Removed from organization",
          description: "You are no longer a member of this organization.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }
      if (!orgRes.ok) throw new Error("Failed to load org info");
      const orgData = await orgRes.json();
      setOrgInfo(orgData);
      setNewOrgName(orgData.name);

      // Fetch members
      const membersRes = await fetch(`${API_BASE_URL}/api/v1/org/members`, {
        credentials: "include",
      });
      if (membersRes.status === 401 || membersRes.status === 404) {
        toast?.({
          title: "Removed from organization",
          description: "You are no longer a member of this organization.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }
      if (!membersRes.ok) throw new Error("Failed to load members");
      const membersData = await membersRes.json();
      setMembers(membersData.members || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load org data");
      console.error("[OrgSettings] Error fetching org data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org/audit-logs`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      } else {
        setAuditLogs([]);
      }
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const copyInviteCode = () => {
    if (orgInfo?.id) {
      navigator.clipboard.writeText(orgInfo.id);
      toast?.({
        title: "Invite code copied!",
        description: "Share this code with team members to invite them.",
      });
    }
  };

  const handleSaveOrgName = async () => {
    if (!newOrgName.trim() || newOrgName === orgInfo?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newOrgName }),
      });
      if (!res.ok) throw new Error("Failed to update organization name");
      setOrgInfo((prev) => (prev ? { ...prev, name: newOrgName } : null));
      setEditingName(false);
      toast?.({
        title: "Organization updated!",
        description: "Your organization name has been updated.",
      });
    } catch (e) {
      toast?.({
        title: "Error",
        description:
          e instanceof Error ? e.message : "Failed to update organization name",
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteOrg = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast?.({
          title: "Organization deleted",
          description:
            "Your organization has been disbanded. You can create or join a new one.",
        });
        setShowDeleteDialog(false);
        await refresh();
        navigate("/", { replace: true });
      } else {
        const err = await res.json();
        toast?.({
          title: "Error",
          description: err.detail || "Failed to delete organization",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast?.({
        title: "Error",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <span className="text-lg text-slate-500">
              Loading organization settings...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchOrgData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header without back button */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Organization Settings
          </h1>
          <p className="text-slate-600">
            Manage your organization and team members
          </p>
        </div>

        <div className="grid gap-6">
          {/* Organization Info */}
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Organization Info</h2>
            </div>
            {orgInfo && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="flex-1"
                        disabled={savingName}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveOrgName}
                        disabled={savingName}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingName}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-slate-800">
                        {orgInfo.name}
                      </div>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingName(true)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Organization ID
                  </label>
                  <div className="font-mono text-sm text-slate-600">
                    {orgInfo.id}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Created
                  </label>
                  <div className="text-slate-600">
                    {new Date(orgInfo.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Invite Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {orgInfo.id}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyInviteCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Share this code with team members to invite them to your
                    organization
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Members */}
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">Team Members</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </Badge>
                {isAdmin &&
                  // <InviteMemberModal orgId={orgInfo?.id || ""} onInviteSent={fetchOrgData} />
                  null}
              </div>
            </div>

            {members.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-800">
                        {member.username}
                      </div>
                      <div className="text-sm text-slate-500">
                        {member.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          member.role === "admin" ? "default" : "secondary"
                        }>
                        {member.role}
                      </Badge>
                      {isAdmin && (
                        <MemberActions
                          member={member}
                          currentUserId={user?.sub || ""}
                          onMemberUpdated={fetchOrgData}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Activity Feed for Admins */}
          {isAdmin && (
            <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold">Activity Feed</h2>
              </div>
              {loadingLogs ? (
                <div>Loading activity…</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-slate-500">No recent activity.</div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm text-slate-800 font-medium">
                          {formatAction(log)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Danger Zone: Delete Org */}
        {isAdmin && (
          <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mt-8">
            <div className="flex items-center gap-2 mb-4">
              <X className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-700">
                Danger Zone
              </h2>
            </div>
            <div className="mb-4 text-slate-700">
              Deleting your organization will remove all members, monitors, and
              logs. This action cannot be undone.
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}>
              Delete Organization
            </Button>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-700">
                Delete Organization
              </DialogTitle>
            </DialogHeader>
            <div className="mb-6 space-y-4">
              <div className="text-slate-700">
                <p className="font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>• All organization members</li>
                  <li>• All delivery monitors</li>
                  <li>• All repository connections</li>
                  <li>• All notification settings</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Billing:</strong> Any active subscription will be
                  cancelled immediately. You won't be charged for future
                  periods.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Data Retention:</strong> Audit logs and billing
                  records are kept for 30 days for compliance purposes, then
                  permanently deleted.
                </p>
              </div>

              <div className="text-red-700 font-medium">
                ⚠️ This action cannot be undone.
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-700">
                Type{" "}
                <span className="font-mono font-bold text-red-700">DELETE</span>{" "}
                to confirm:
              </label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOrg}
                disabled={deleting || deleteConfirmation !== "DELETE"}>
                {deleting ? "Deleting…" : "Delete Organization"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Helper to format action text
function formatAction(log: AuditLog) {
  switch (log.action) {
    case "monitor_created":
      return `Monitor created: ${log.details.repo}`;
    case "monitor_deleted":
      return `Monitor deleted: ${log.details.repo || log.target_id}`;
    case "member_invited":
      return `Invited member: ${log.target_id} (${log.details.role})`;
    case "member_role_changed":
      return `Changed role for member ${log.target_id} to ${log.details.new_role}`;
    case "member_removed":
      return `Removed member: ${log.target_id}`;
    default:
      return `${log.action} (${log.target_type})`;
  }
}
