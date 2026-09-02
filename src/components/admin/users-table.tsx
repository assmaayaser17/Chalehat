"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Pencil, Tag, Unlock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { changeUserRoleAction, toggleUserBlockAction } from "@/lib/actions/user-actions";
import { assignCustomerCategoriesAction } from "@/lib/actions/customer-category-actions";
import { ROLE_LABELS_AR, type ApiUser, type CustomerCategory, type UserRole } from "@/lib/api/types";

const ALL_ROLES: UserRole[] = ["SuperAdmin", "SystemAdmin", "ChaletAdmin", "Customer"];

type PendingAction =
  | { userId: string; type: "block" }
  | { userId: string; type: "role" }
  | { userId: string; type: "categories" };

/**
 * `GET /api/admin/users` never returns a customer's current categories
 * (confirmed live — see `normalizeApiUser`), so the assign-categories badge
 * has no real backend source to survive a reload from. Persisting the
 * assignment in localStorage keeps the badge visible across reloads/tab
 * closes on this browser — purely a frontend memory of what was set here,
 * not a source of truth; if the same customer is edited from another
 * browser/admin, this won't know about it.
 */
const CATEGORY_STORAGE_KEY = "chalehat:customer-categories";

function readStoredCategories(): Record<string, CustomerCategory[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CustomerCategory[]>) : {};
  } catch {
    return {};
  }
}

function writeStoredCategories(userId: string, assigned: CustomerCategory[]) {
  if (typeof window === "undefined") return;
  try {
    const all = readStoredCategories();
    if (assigned.length > 0) all[userId] = assigned;
    else delete all[userId];
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Private browsing / storage disabled / quota — the badge just won't
    // survive a reload in that case, nothing else depends on this.
  }
}

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
  categories = [],
}: {
  initialUsers: ApiUser[];
  currentUserId: string;
  currentUserRole: UserRole;
  /** SuperAdmin only — see the doc comment on `CustomerCategory` in lib/api/types.ts. */
  categories?: CustomerCategory[];
}) {
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [reason, setReason] = React.useState("");
  const [newRole, setNewRole] = React.useState<UserRole>("ChaletAdmin");
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // `initialUsers` never carries `customerCategories` (see the doc comment
  // above `CATEGORY_STORAGE_KEY`) — merge in whatever's stored locally so a
  // resync (this prop changing after *any* row's `router.refresh()`, not
  // just the one just edited) doesn't wipe the badge back to nothing.
  React.useEffect(() => {
    const stored = readStoredCategories();
    setUsers(initialUsers.map((u) => ({ ...u, customerCategories: u.customerCategories ?? stored[u.id] })));
  }, [initialUsers]);

  function canToggleBlock(user: ApiUser): boolean {
    if (user.id === currentUserId) return false;
    if (currentUserRole === "SuperAdmin") return true;
    return currentUserRole === "SystemAdmin" && user.role === "Customer";
  }

  function canChangeRole(user: ApiUser): boolean {
    return currentUserRole === "SuperAdmin" && user.id !== currentUserId;
  }

  function canAssignCategories(user: ApiUser): boolean {
    return currentUserRole === "SuperAdmin" && user.role === "Customer" && categories.length > 0;
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

  /**
   * Pre-selects whatever `user.customerCategories` already has (only
   * populated if the backend actually includes it on the list response —
   * see `normalizeApiUser`). If it's empty/absent, this starts from nothing,
   * so submitting would then clear any categories the customer already has
   * on the backend (PUT replace semantics) — a real risk until that field
   * is confirmed to exist.
   */
  function startCategories(user: ApiUser) {
    setError(null);
    setSelectedCategoryIds(new Set(user.customerCategories?.map((c) => c.id) ?? []));
    setPendingAction({ userId: user.id, type: "categories" });
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  async function confirmCategories(user: ApiUser) {
    setError(null);
    setIsSaving(true);
    try {
      const result = await assignCustomerCategoriesAction(user.id, Array.from(selectedCategoryIds));
      if (!result.success) {
        setError(result.message);
        return;
      }
      const assigned = categories.filter((c) => selectedCategoryIds.has(c.id));
      writeStoredCategories(user.id, assigned);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, customerCategories: assigned } : u)));
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
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-40">Actions</TableHead>
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
                    <TableCell className="tabular-nums text-muted-foreground" dir="ltr">
                      {user.phoneNumber ?? <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="accent">{ROLE_LABELS_AR[user.role] ?? user.role ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.customerCategories && user.customerCategories.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {user.customerCategories.map((category) => (
                            <Badge key={category.id} variant="outline" dir="auto" className="gap-1">
                              <Tag className="h-3 w-3" /> {category.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-stretch gap-1.5">
                        {!actionHere && canToggleBlock(user) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="justify-start"
                            onClick={() => startBlock(user)}
                          >
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="justify-start"
                            onClick={() => startRole(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Change role
                          </Button>
                        )}
                        {!actionHere && canAssignCategories(user) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="justify-start"
                            onClick={() => startCategories(user)}
                          >
                            <Tag className="h-3.5 w-3.5" /> Categories
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {actionHere?.type === "block" && (
                    <TableRow>
                      <TableCell colSpan={7}>
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
                      <TableCell colSpan={7}>
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

                  {actionHere?.type === "categories" && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="space-y-3 rounded-md bg-muted p-3">
                          <div>
                            <Label>Categories for {user.fullName}</Label>
                            <p className="text-xs text-muted-foreground">
                              This replaces the customer&apos;s current categories with whatever&apos;s checked below.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {categories.map((category) => (
                              <label key={category.id} dir="auto" className="flex items-center gap-1.5 text-sm">
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.has(category.id)}
                                  onChange={() => toggleCategory(category.id)}
                                  className="h-4 w-4 rounded border-input accent-primary-600"
                                />
                                {category.name}
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <Button type="button" size="sm" loading={isSaving} onClick={() => confirmCategories(user)}>
                              <Check className="h-4 w-4" /> Save categories
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No users match these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
