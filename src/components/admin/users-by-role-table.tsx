"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ROLE_LABELS_AR, type ApiUser, type UserRole } from "@/lib/api/types";

const ROLE_OPTIONS: UserRole[] = ["SuperAdmin", "SystemAdmin", "ChaletAdmin"];

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

async function fetchUsersByRole(role: UserRole): Promise<ApiUser[]> {
  const res = await fetch(`/api/admin/users?role=${role}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Couldn't fetch users");
  return data.users as ApiUser[];
}

/**
 * Client Component: the whole point is instant refetching when the role
 * filter changes, driven by React Query against our own `/api/admin/users`
 * Route Handler (which holds the real bearer token server-side).
 */
export function UsersByRoleTable() {
  const [role, setRole] = React.useState<UserRole>("ChaletAdmin");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users", role],
    queryFn: () => fetchUsersByRole(role),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Filter by role</p>
        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS_AR[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {(error as Error).message}
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState icon={Users} title="No users with this role" />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Access Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary-100 text-primary-800">
                        {initials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span dir="auto" className="font-semibold text-foreground">
                      {user.fullName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">@{user.userName}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="accent">{ROLE_LABELS_AR[user.role] ?? user.role}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
