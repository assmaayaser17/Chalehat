"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/#chalets", label: "Chalets" },
  { href: "/ads", label: "Ads" },
];

/** Client Component: the Sheet needs open/close state — isolated here so the rest of the navbar stays server-rendered. */
export function MobileNav({ authSlot }: { authSlot: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-accent-300 md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent title="Main menu">
        <div className="mb-6 mt-2">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-6 border-t border-border pt-6">{authSlot}</div>
      </SheetContent>
    </Sheet>
  );
}
