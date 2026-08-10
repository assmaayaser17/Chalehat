"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Unlock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { changeUserRoleAction, toggleUserBlockAction } from "@/lib/actions/user-actions";
import { ROLE_LABELS_AR, type ApiUser, type UserRole } from "@/lib/api/types";

const ALL_ROLES: UserRole[] = ["SuperAdmin", "SystemAdmin", "ChaletAdmin", "Customer"];

type PendingAction = { userId: string; type: "block" } | { userId: string; type: "role" };

/** First letters of up to the first two words of a full name, for the avatar fallback. */
function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Client Component: server-fetched user list (`/dashboard/users`) with
 * inline block/unblock and role-change actions, both server actions +
 * `router.refresh()` to resync — same pattern as `SeasonsTable`/`AmenitiesList`.
 * Which actions show per row is gated both here (for a clean UI) and again
 * server-side in the actions themselves (the real enforcement).
 */
export function UsersTable({
  initialUsers,
  currentUserId,
  currentUserRole,
}: {
  initialUsers: ApiUser[];
  currentUserId: string;
  currentUserRole: UserRole;
}) {
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [reason, setReason] = React.useState("");
  const [newRole, setNewRole] = React.useState<UserRole>("ChaletAdmin");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  function canToggleBlock(user: ApiUser): boolean {
    if (user.id === currentUserId) return false;
    if (currentUserRole === "SuperAdmin") return true;
    return currentUserRole === "SystemAdmin" && user.role === "Customer";
  }

  function canChangeRole(user: ApiUser): boolean {
    return currentUserRole === "SuperAdmin" && user.id !== currentUserId;
  }

  function startBlock(user: ApiUser) {
    setError(null);
    setReason("");
    setPendingAction({ userId: user.id, type: "block" });
  }

  function startRole(user: ApiUser) {
    setError(null);
    setNewRole(user.role);
    setPendingAction({ userId: user.id, type: "role" });
  }

  async function confirmBlock(user: ApiUser) {
    if (!reason.trim()) {
      setError("Enter a reason.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const result = await toggleUserBlockAction(user.id, user.role, reason);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !u.isBlocked, blockReason: reason } : u)));
      setPendingAction(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmRole(user: ApiUser) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await changeUserRoleAction(user.id, newRole);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setPendingAction(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-56 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => {
              const actionHere = pendingAction?.userId === user.id ? pendingAction : null;
              return (
                <React.Fragment key={user.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary-100 text-primary-800">{initials(user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p dir="auto" className="font-semibold text-foreground">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">@{user.userName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="accent">{ROLE_LABELS_AR[user.role] ?? user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {!actionHere && canToggleBlock(user) && (
                          <Button type="button" size="sm" variant="outline" onClick={() => startBlock(user)}>
                            {user.isBlocked ? (
                              <>
                                <Unlock className="h-3.5 w-3.5" /> Unblock
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" /> Block
                              </>
                            )}
                          </Button>
                        )}
                        {!actionHere && canChangeRole(user) && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => startRole(user)}>
                            Change role
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {actionHere?.type === "block" && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                          <div className="w-72 space-y-1.5">
                            <Label htmlFor={`block-reason-${user.id}`}>
                              Reason to {user.isBlocked ? "unblock" : "block"} {user.fullName}
                            </Label>
                            <Textarea
                              id={`block-reason-${user.id}`}
                              dir="auto"
                              rows={2}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder={user.isBlocked ? "Complaint resolved" : "Repeated complaints"}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={user.isBlocked ? "default" : "destructive"}
                            loading={isSaving}
                            onClick={() => confirmBlock(user)}
                          >
                            <Check className="h-4 w-4" /> Confirm {user.isBlocked ? "unblock" : "block"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setPendingAction(null)}
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {actionHere?.type === "role" && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                          <div className="w-52 space-y-1.5">
                            <Label htmlFor={`role-${user.id}`}>New role for {user.fullName}</Label>
                            <select
                              id={`role-${user.id}`}
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value as UserRole)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS_AR[r]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            loading={isSaving}
                            disabled={newRole === user.role}
                            onClick={() => confirmRole(user)}
                          >
                            <Check className="h-4 w-4" /> Confirm role change
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setPendingAction(null)}
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No users match these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
