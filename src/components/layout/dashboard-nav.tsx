"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

function navItemsForRole(role: UserRole): NavItem[] {
  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(role as (typeof STAFF_MANAGEMENT_ROLES)[number]);
  const isChaletAdmin = role === "ChaletAdmin";
  const isSuperAdmin = role === "SuperAdmin";

  const items: NavItem[] = [];
  if (isStaffAdmin || isSuperAdmin) {
    items.push({ href: "/dashboard/staff", label: "Staff", icon: Users });
    items.push({ href: "/dashboard/amenities", label: "Amenities", icon: Sparkles });
    items.push({ href: "/dashboard/amenities/new", label: "Add amenity", icon: PlusCircle });
  }
  if (isChaletAdmin || isSuperAdmin) {
    items.push({ href: "/dashboard/chalets", label: isSuperAdmin ? "All Chalets" : "My Chalets", icon: Home });
    items.push({ href: "/dashboard/chalets/new", label: "Add chalet", icon: PlusCircle });
  }
  return items;
}

/** Client Component: `usePathname` is a hook, so the nav (and only the nav) must be client-rendered. */
export function DashboardNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary-800"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
