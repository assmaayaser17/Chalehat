import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

interface PageProps {
  searchParams: Promise<{ resetPassword?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { resetPassword, next } = await searchParams;

  return (
    <AuthCard title="Log in" description="Enter your details to access your account">
      {resetPassword && (
        <Alert variant="success" className="mb-4">
          Your password was reset successfully — you can log in now.
        </Alert>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
