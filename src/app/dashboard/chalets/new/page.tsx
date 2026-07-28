import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateChaletForm } from "@/components/chalets/create-chalet-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSession } from "@/lib/auth/session";
import { getUsersByRole } from "@/lib/api/admin";

export const metadata: Metadata = { title: "Add Chalet" };

export default async function NewChaletPage() {
  const session = await getSession();
  // Only SuperAdmin creates chalets — `middleware.ts` already blocks this
  // route for anyone else, this is defense in depth (same pattern as
  // `dashboard/layout.tsx`).
  if (session?.role !== "SuperAdmin") redirect("/dashboard/chalets");

  // SuperAdmin must pick which ChaletAdmin the chalet belongs to — the API
  // rejects an ownerAdminId that doesn't belong to a ChaletAdmin account.
  const chaletAdmins = await getUsersByRole("ChaletAdmin");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Add a new chalet"
        description="Enter the chalet's details so it appears on the homepage for visitors."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Chalet details</CardTitle>
          <CardDescription>All fields are required unless noted otherwise.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateChaletForm chaletAdmins={chaletAdmins} />
        </CardContent>
      </Card>
    </div>
  );
}
