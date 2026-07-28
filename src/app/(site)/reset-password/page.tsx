import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

interface PageProps {
  searchParams: Promise<{ phone?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { phone } = await searchParams;

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the code we sent you and choose a new password."
      footer={
        <>
          Didn&apos;t get a code?{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Try again
          </Link>
        </>
      }
    >
      <ResetPasswordForm defaultPhoneNumber={phone} />
    </AuthCard>
  );
}
