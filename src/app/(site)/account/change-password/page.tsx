import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Change Password" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/change-password");

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update the password you use to log in.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
