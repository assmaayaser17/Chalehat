import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";

export const metadata: Metadata = { title: "Verify your phone number" };

interface PageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function VerifyOtpPage({ searchParams }: PageProps) {
  const { userId } = await searchParams;
  // No userId to verify against — this page only makes sense reached via
  // registerAction's redirect, so send them back to start over.
  if (!userId) redirect("/register");

  return (
    <AuthCard
      title="Verify your phone number"
      description="We sent a verification code by SMS to the phone number you registered with."
      footer={
        <>
          Wrong number?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register again
          </Link>
        </>
      }
    >
      <VerifyOtpForm userId={userId} />
    </AuthCard>
  );
}
