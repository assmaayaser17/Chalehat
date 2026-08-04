import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarRange,
  Home,
  PlusCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES } from "@/lib/api/types";
import { getChaletsPage } from "@/lib/api/chalet";
import { getAllAmenities } from "@/lib/api/amenity";
import { getAllSeasons } from "@/lib/api/season";
import { getUsersByRole } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-background p-5 text-center transition-colors hover:border-accent-300 hover:bg-accent-50"
    >
      <Icon className="h-5 w-5 text-accent-700" />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </Link>
  );
}

/** SuperAdmin-only landing view — platform-wide counts pulled from the real list endpoints, no fabricated metrics. */
async function OverviewPage({ fullName }: { fullName: string }) {
  const [chaletsResult, amenities, seasons, superAdmins, systemAdmins, chaletAdmins] = await Promise.allSettled([
    getChaletsPage(1, 5),
    getAllAmenities(),
    getAllSeasons(),
    getUsersByRole("SuperAdmin"),
    getUsersByRole("SystemAdmin"),
    getUsersByRole("ChaletAdmin"),
  ]);

  const chalets = chaletsResult.status === "fulfilled" ? chaletsResult.value : null;
  const amenitiesCount = amenities.status === "fulfilled" ? amenities.value.length : null;
  const seasonsCount = seasons.status === "fulfilled" ? seasons.value.length : null;
  const staffCount =
    superAdmins.status === "fulfilled" && systemAdmins.status === "fulfilled" && chaletAdmins.status === "fulfilled"
      ? superAdmins.value.length + systemAdmins.value.length + chaletAdmins.value.length
      : null;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Overview" description={`Welcome back, ${fullName}. Here's the platform at a glance.`} />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Home}
          label="Total Chalets"
          value={chalets ? chalets.totalCount : "—"}
          hint="Across the whole platform"
        />
        <StatCard icon={UserPlus} label="Total Staff" value={staffCount ?? "—"} hint="SuperAdmin, SystemAdmin, ChaletAdmin" />
        <StatCard icon={Sparkles} label="Amenities" value={amenitiesCount ?? "—"} hint="Available to link to chalets" />
        <StatCard icon={CalendarRange} label="Seasons" value={seasonsCount ?? "—"} hint="Defined seasonal periods" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Chalets</h3>
            <Link href="/dashboard/chalets" className="text-sm font-medium text-primary-700 hover:underline">
              View all
            </Link>
          </div>

          {!chalets || chalets.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No chalets in the system yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {chalets.items.map((chalet) => {
                const isInactive = chalet.status && chalet.status !== "Active";
                return (
                  <div key={chalet.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div dir="auto" className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{chalet.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{chalet.address}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isInactive && (
                        <Badge variant="destructive" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                      {chalet.showPrice && (
                        <span className="text-sm font-bold tabular-nums text-accent-700">
                          {formatCurrency(chalet.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Quick Management</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/dashboard/chalets/new" icon={PlusCircle} label="Add Chalet" />
            <QuickLink href="/dashboard/amenities/new" icon={Sparkles} label="Add Amenity" />
            <QuickLink href="/dashboard/seasons/new" icon={CalendarRange} label="Add Season" />
            <QuickLink href="/dashboard/staff" icon={UserPlus} label="Manage Staff" />
          </div>
        </Card>
      </section>
    </div>
  );
}

/** `/dashboard` routes each role to its home section; SuperAdmin gets a real overview instead of a redirect. */
export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "SuperAdmin") {
    return <OverviewPage fullName={session.fullName} />;
  }

  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(
    session.role as (typeof STAFF_MANAGEMENT_ROLES)[number],
  );
  if (isStaffAdmin) redirect("/dashboard/staff");
  redirect("/dashboard/chalets");
}
