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
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-background lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DashboardNav role={session.role} />
        </div>
        <div className="border-t border-border p-4">
          <div className="rounded-md bg-muted/60 px-3 py-2.5">
            <p dir="auto" className="truncate text-sm font-medium text-foreground">
              {session.fullName}
            </p>
            <Badge variant="default" className="mt-1.5">
              {ROLE_LABELS_AR[session.role]}
            </Badge>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <DashboardMobileNav role={session.role} />
            <Logo />
          </div>
          <span className="hidden text-sm text-muted-foreground lg:block">
            Welcome back,{" "}
            <strong dir="auto" className="font-semibold text-foreground">
              {session.fullName}
            </strong>
          </span>
          <UserMenu fullName={session.fullName} role={session.role} dashboardHref="/dashboard" />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
