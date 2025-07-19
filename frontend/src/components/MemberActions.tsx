import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2, UserX } from "lucide-react";

interface MemberActionsProps {
  member: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
  currentUserId: string;
  onMemberUpdated: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const MemberActions = ({
  member,
  currentUserId,
  onMemberUpdated,
}: MemberActionsProps) => {
  const [changingRole, setChangingRole] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === member.role) return;

    setChangingRole(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/org/members/${member.user_id}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to update role");
      }

      toast?.({
        title: "Role updated!",
        description: `${member.username} is now ${newRole}.`,
      });
      onMemberUpdated();
    } catch (e) {
      toast?.({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setChangingRole(false);
    }
  };

  const handleRemoveMember = async () => {
    setRemoving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/org/members/${member.user_id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to remove member");
      }

      toast?.({
        title: "Member removed!",
        description: `${member.username} has been removed from the organization.`,
      });
      onMemberUpdated();
      setShowRemoveDialog(false);
    } catch (e) {
      toast?.({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const isCurrentUser = member.user_id === currentUserId;

  return (
    <div className="flex items-center gap-2">
      {/* Role Change Dropdown */}
      <Select
        value={member.role}
        onValueChange={handleRoleChange}
        disabled={changingRole || isCurrentUser}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">Viewer</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      {/* Remove Member Button */}
      {!isCurrentUser && (
        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <UserX className="w-12 h-12 mx-auto mb-2 text-red-600" />
                <h3 className="font-medium">Remove {member.username}?</h3>
                <p className="text-sm text-slate-600">
                  This will remove {member.username} from the organization. They
                  will lose access to all monitors and data.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRemoveDialog(false)}
                  disabled={removing}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveMember}
                  disabled={removing}>
                  {removing ? "Removing..." : "Remove Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
