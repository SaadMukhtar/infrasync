import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, AlertTriangle, CheckCircle, User, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface OrgInfo {
  id: string;
  name: string;
  created_at: string;
}

const UserSettings = () => {
  const { user, logout } = useAuth();
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);

  const fetchOrgInfo = async () => {
    setLoadingOrg(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOrgInfo(data);
      } else {
        setOrgInfo(null);
      }
    } catch (e) {
      setOrgInfo(null);
    } finally {
      setLoadingOrg(false);
    }
  };

  useEffect(() => {
    fetchOrgInfo();
  }, []);

  const validateDeletion = async () => {
    setLoadingValidation(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/validate-deletion`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
      } else {
        setValidationResult({
          valid: false,
          message: "Failed to validate deletion impact",
        });
      }
    } catch (e) {
      setValidationResult({
        valid: false,
        message: "Failed to validate deletion impact",
      });
    } finally {
      setLoadingValidation(false);
    }
  };

  useEffect(() => {
    if (showDeleteAccountDialog) {
      validateDeletion();
    }
  }, [showDeleteAccountDialog]);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast?.({
          title: "Account deleted",
          description: "Your account has been deleted. Goodbye!",
        });
        setShowDeleteAccountDialog(false);
        await logout(true); // Don't reload, just clear state
        window.location.href = "/";
      } else {
        const err = await res.json();
        toast?.({
          title: "Error",
          description: err.detail || "Failed to delete account",
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
      setDeletingAccount(false);
    }
  };

  const renderValidationMessage = () => {
    if (loadingValidation) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Analyzing account deletion impact...
        </div>
      );
    }

    if (!validationResult) {
      return null;
    }

    const messages = validationResult.message.split("; ");
    const hasWarnings = messages.some((msg) => msg.includes("WARNING"));

    return (
      <div
        className={`border rounded-lg p-3 ${
          hasWarnings
            ? "bg-red-50 border-red-200"
            : "bg-green-50 border-green-200"
        }`}>
        <div className="flex items-start gap-2 mb-2">
          {hasWarnings ? (
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          )}
          <span
            className={`text-sm font-medium ${
              hasWarnings ? "text-red-800" : "text-green-800"
            }`}>
            Deletion Impact Analysis
          </span>
        </div>
        <div className="space-y-1">
          {messages.map((message, index) => {
            const isWarning = message.includes("WARNING");
            return (
              <div
                key={index}
                className={`text-sm ${
                  isWarning ? "text-red-700" : "text-green-700"
                }`}>
                {isWarning ? "⚠️ " : "✓ "}
                {message}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <h1 className="text-2xl font-bold mb-6">User Settings</h1>

        {/* GitHub Profile */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">GitHub Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt="GitHub avatar"
                className="w-16 h-16 rounded-full border-2 border-slate-200 shadow-sm"
              />
            )}
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Username
                </label>
                <div className="text-lg font-semibold text-slate-900">
                  {user?.username || "Not available"}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="text-slate-900">
                  {user?.email || "Not available"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Organization */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Organization</h2>
          </div>
          {loadingOrg ? (
            <div className="flex items-center gap-2 text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
              Loading organization info...
            </div>
          ) : orgInfo ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Organization Name
                </label>
                <div className="text-lg font-semibold text-slate-900">
                  {orgInfo.name}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Your Role
                </label>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {user?.role || "Unknown"}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Member Since
                </label>
                <div className="text-slate-900">
                  {new Date(orgInfo.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">
              No organization information available
            </div>
          )}
        </Card>

        {/* Danger Zone: Delete Account */}
        <Card className="p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm mt-8">
          <div className="flex items-center gap-2 mb-4">
            <X className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-red-700">
              Delete Account
            </h2>
          </div>
          <div className="mb-4 text-slate-700">
            Deleting your account will remove all your data and cannot be
            undone.
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAccountDialog(true)}>
            Delete Account
          </Button>
        </Card>
        {/* Delete Account Confirmation Dialog */}
        <Dialog
          open={showDeleteAccountDialog}
          onOpenChange={setShowDeleteAccountDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-700">Delete Account</DialogTitle>
            </DialogHeader>
            <div className="mb-6 space-y-4">
              {renderValidationMessage()}

              <div className="text-slate-700">
                <p className="font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>• Your user account and profile</li>
                  <li>• All your org memberships</li>
                  <li>• Any orgs where you're the only admin</li>
                  <li>• All associated data and settings</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Org Impact:</strong> If you're the only admin of an
                  organization, that org will be deleted along with all its data
                  and billing.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Data Retention:</strong> Some data may be kept for 30
                  days for compliance purposes, then permanently deleted.
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
                onClick={() => setShowDeleteAccountDialog(false)}
                disabled={deletingAccount}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmation !== "DELETE"}>
                {deletingAccount ? "Deleting…" : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default UserSettings;
