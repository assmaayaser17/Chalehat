"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, Home, PlusCircle, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/** Same routes/role-gating as before, just organized into labeled groups for the sidebar. */
function navSectionsForRole(role: UserRole): NavSection[] {
  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(role as (typeof STAFF_MANAGEMENT_ROLES)[number]);
  const isChaletAdmin = role === "ChaletAdmin";
  const isSuperAdmin = role === "SuperAdmin";

  const sections: NavSection[] = [];

  if (isStaffAdmin || isSuperAdmin) {
    sections.push({
      label: "Staff & catalog",
      items: [
        { href: "/dashboard/staff", label: "Staff", icon: Users },
        { href: "/dashboard/amenities", label: "Amenities", icon: Sparkles },
        { href: "/dashboard/amenities/new", label: "Add amenity", icon: PlusCircle },
      ],
    });
  }

  // Seasons are a shared, global concept — SuperAdmin only, unlike amenities
  // which SystemAdmin also manages.
  if (isSuperAdmin) {
    sections.push({
      label: "Seasons",
      items: [
        { href: "/dashboard/seasons", label: "Seasons", icon: CalendarRange },
        { href: "/dashboard/seasons/new", label: "Add season", icon: PlusCircle },
      ],
    });
  }

  if (isChaletAdmin || isSuperAdmin) {
    const items: NavItem[] = [
      { href: "/dashboard/chalets", label: isSuperAdmin ? "All Chalets" : "My Chalets", icon: Home },
    ];
    // Only SuperAdmin creates chalets — a ChaletAdmin only manages chalets
    // that were already assigned to them, they never create their own.
    if (isSuperAdmin) {
      items.push({ href: "/dashboard/chalets/new", label: "Add chalet", icon: PlusCircle });
    }
    // ChaletAdmin has no access to the SuperAdmin/SystemAdmin amenities CRUD
    // page — this is a read-only browse view so they can see what's available
    // to link to their chalets.
    if (isChaletAdmin) {
      items.push({ href: "/dashboard/chalets/amenities", label: "Amenities", icon: Sparkles });
    }
    sections.push({ label: "Chalets", items });
  }

  return sections;
}

/** Client Component: `usePathname` is a hook, so the nav (and only the nav) must be client-rendered. */
export function DashboardNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = navSectionsForRole(role);

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
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
          </div>
        </div>
      ))}
    </nav>
  );
}
