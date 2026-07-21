import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

function dashboardHrefForRole(role: string) {
  if (STAFF_MANAGEMENT_ROLES.includes(role as (typeof STAFF_MANAGEMENT_ROLES)[number])) return "/dashboard/staff";
  if (role === "ChaletAdmin") return "/dashboard/chalets";
  return "/dashboard";
}

/**
 * Server Component — reads the session cookie on the server and renders the
 * right-hand auth area accordingly. Only the dropdown/sheet interactivity is
 * delegated to small Client Components (`UserMenu`, `MobileNav`).
 */
export async function Navbar() {
  const session = await getSession();

  const authSlot = session ? (
    <div className="flex items-center gap-3">
      <UserMenu
        fullName={session.fullName}
        role={session.role}
        dashboardHref={dashboardHrefForRole(session.role)}
      />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Log in</Link>
      </Button>
      <Button variant="default" size="sm" asChild>
        <Link href="/register">Sign up</Link>
      </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
            Home
          </Link>
          <Link
            href="/#chalets"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Chalets
          </Link>
        </nav>

        <div className="hidden md:block">{authSlot}</div>
        <MobileNav authSlot={authSlot} />
      </div>
    </header>
  );
}
