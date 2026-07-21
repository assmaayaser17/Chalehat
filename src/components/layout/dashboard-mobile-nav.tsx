"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import type { UserRole } from "@/lib/api/types";

/** Client Component: bundles the Sheet's open state with the nav's active-link state for mobile. */
export function DashboardMobileNav({ role }: { role: UserRole }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open dashboard menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent title="Dashboard menu">
        <div className="mb-6 mt-2">
          <Logo />
        </div>
        <DashboardNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
