import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { ApiError } from "@/lib/api/client";
import { getAllUsers } from "@/lib/api/admin";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABELS_AR, type UserRole } from "@/lib/api/types";

interface PageProps {
  searchParams: Promise<{ role?: string; isBlocked?: string; search?: string }>;
}

export const metadata: Metadata = { title: "Users" };

const ALL_ROLES: UserRole[] = ["SuperAdmin", "SystemAdmin", "ChaletAdmin", "Customer"];

function isUserRole(value: string): value is UserRole {
  return (ALL_ROLES as string[]).includes(value);
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { role: roleParam, isBlocked: isBlockedParam, search } = await searchParams;
  const role = roleParam && isUserRole(roleParam) ? roleParam : undefined;
  const isBlocked = isBlockedParam === "true" ? true : isBlockedParam === "false" ? false : undefined;

  const session = await getSession();

  let users: Awaited<ReturnType<typeof getAllUsers>> = [];
  let errorMessage: string | null = null;
  try {
    users = await getAllUsers({ role, isBlocked, search });
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load users.";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Users" description="Browse every user, block or unblock accounts, and manage roles." />

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="w-48 space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue={role ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All roles</option>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS_AR[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-44 space-y-1.5">
              <Label htmlFor="isBlocked">Status</Label>
              <select
                id="isBlocked"
                name="isBlocked"
                defaultValue={isBlockedParam ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Any status</option>
                <option value="false">Active</option>
                <option value="true">Blocked</option>
              </select>
            </div>

            <div className="w-56 space-y-1.5">
              <Label htmlFor="search">Search</Label>
              <Input id="search" name="search" defaultValue={search ?? ""} placeholder="Name, username, or email" />
            </div>

            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users match these filters" />
      ) : session ? (
        <UsersTable initialUsers={users} currentUserId={session.userId} currentUserRole={session.role} />
      ) : null}
    </div>
  );
}
