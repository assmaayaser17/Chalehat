import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateChaletForm } from "@/components/chalets/create-chalet-form";
import { getSession } from "@/lib/auth/session";
import { getUsersByRole } from "@/lib/api/admin";

export const metadata: Metadata = { title: "Add Chalet" };

export default async function NewChaletPage() {
  const session = await getSession();
  // A ChaletAdmin creating their own chalet doesn't need to pick an owner —
  // the server action stamps their own id. Anyone else (SuperAdmin) must
  // pick which ChaletAdmin the chalet belongs to, since the API rejects an
  // ownerAdminId that doesn't belong to a ChaletAdmin account.
  const chaletAdmins = session && session.role !== "ChaletAdmin" ? await getUsersByRole("ChaletAdmin") : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add a new chalet</h1>
        <p className="text-muted-foreground">Enter the chalet's details so it appears on the homepage for visitors.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chalet details</CardTitle>
          <CardDescription>All fields are required unless noted otherwise.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateChaletForm chaletAdmins={chaletAdmins} />
        </CardContent>
      </Card>
    </div>
  );
}
