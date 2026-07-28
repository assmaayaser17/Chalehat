import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryProvider } from "@/components/providers/query-provider";
import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { UsersByRoleTable } from "@/components/admin/users-by-role-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Staff Management" };

/**
 * Server Component page. `QueryProvider` is the only Client Component
 * boundary here — it wraps the two small interactive pieces
 * (`CreateStaffForm`, `UsersByRoleTable`) so they can share one QueryClient.
 */
export default function StaffPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Staff Management"
        description="Add new system admins or chalet admins and browse users by role."
      />

      <QueryProvider>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border">
              <CardTitle>Add new staff</CardTitle>
              <CardDescription>An account will be created directly with the selected role.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <CreateStaffForm />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="border-b border-border">
              <CardTitle>Users</CardTitle>
              <CardDescription>Browse users by role.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <UsersByRoleTable />
            </CardContent>
          </Card>
        </div>
      </QueryProvider>
    </div>
  );
}
