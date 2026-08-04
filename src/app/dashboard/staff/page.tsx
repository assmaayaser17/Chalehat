import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
          <Card className="overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2.5 bg-primary-800 px-5 py-4 text-white">
              <UserPlus className="h-4 w-4 text-accent-300" />
              <div>
                <p className="text-sm font-bold">Add New Staff</p>
                <p className="text-xs text-primary-100">An account is created immediately with the selected role.</p>
              </div>
            </div>
            <CardContent className="pt-5">
              <CreateStaffForm />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardContent className="pt-5">
              <UsersByRoleTable />
            </CardContent>
          </Card>
        </div>
      </QueryProvider>
    </div>
  );
}
