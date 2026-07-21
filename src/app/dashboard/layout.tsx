import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABELS_AR } from "@/lib/api/types";
import { Logo } from "@/components/layout/logo";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";

/**
 * Server Component. `middleware.ts` already gate-keeps `/dashboard/*`, but we
 * re-check here too (defense in depth — middleware only reads the cookie,
 * this is the actual source of truth) and pass the role down as a plain
 * string prop into the two Client Components that need interactivity.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      <aside className="hidden w-64 shrink-0 border-e border-border bg-background p-5 lg:block">
        <Logo />
        <Badge variant="default" className="mt-4">
          {ROLE_LABELS_AR[session.role]}
        </Badge>
        <div className="mt-6">
          <DashboardNav role={session.role} />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <DashboardMobileNav role={session.role} />
            <Logo />
          </div>
          <span className="hidden text-sm text-muted-foreground lg:block">
            Welcome, <strong className="text-foreground">{session.fullName}</strong>
          </span>
          <UserMenu fullName={session.fullName} role={session.role} dashboardHref="/dashboard" />
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
