import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

interface PageProps {
  searchParams: Promise<{ registered?: string; verified?: string; resetPassword?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { registered, verified, resetPassword, next } = await searchParams;

  return (
    <AuthCard
      title="Log in"
      description="Enter your details to access your account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create a new account
          </Link>
        </>
      }
    >
      {registered && (
        <Alert variant="success" className="mb-4">
          Your account was created — check your phone for a verification code before logging in.
        </Alert>
      )}
      {verified && (
        <Alert variant="success" className="mb-4">
          Your phone number was verified — you can log in now.
        </Alert>
      )}
      {resetPassword && (
        <Alert variant="success" className="mb-4">
          Your password was reset successfully — you can log in now.
        </Alert>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
