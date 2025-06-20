import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Copy, Mail } from "lucide-react";

interface InviteMemberModalProps {
  orgId: string;
  onInviteSent: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const InviteMemberModal = ({
  orgId,
  onInviteSent,
}: InviteMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "admin">("viewer");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to send invite");
      }

      const data = await res.json();
      setInviteLink(`${window.location.origin}/join?code=${orgId}`);
      toast?.({
        title: "Invite sent!",
        description: "The invite has been sent to the user.",
      });
      onInviteSent();
    } catch (e) {
      toast?.({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast?.({
        title: "Invite link copied!",
        description: "Share this link with the user.",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("viewer");
    setInviteLink("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: "viewer" | "admin") => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    Viewer - Can view monitors and digests
                  </SelectItem>
                  <SelectItem value="admin">
                    Admin - Can manage monitors and team
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">Invite Sent!</h3>
              <p className="text-sm text-slate-600">
                An invite has been sent to {email}
              </p>
            </div>

            <div>
              <Label>Invite Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button size="sm" variant="outline" onClick={copyInviteLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
