import type { Metadata } from "next";
import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ApiError } from "@/lib/api/client";
import { getSystemStatistics } from "@/lib/api/statistics";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export const metadata: Metadata = { title: "Platform Statistics" };

function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function SystemStatisticsPage({ searchParams }: PageProps) {
  const { startDate: startDateParam, endDate: endDateParam } = await searchParams;

  const currentYear = new Date().getUTCFullYear();
  const startDate = isIsoDate(startDateParam) ? startDateParam : `${currentYear}-01-01`;
  const endDate = isIsoDate(endDateParam) ? endDateParam : `${currentYear}-12-31`;

  let stats: Awaited<ReturnType<typeof getSystemStatistics>> | null = null;
  let errorMessage: string | null = null;
  try {
    stats = await getSystemStatistics(startDate, endDate);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load platform statistics.";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Platform Statistics" description="Performance across the whole platform over a chosen period." />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="w-40 space-y-1.5">
              <Label htmlFor="startDate">From</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={startDate} />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="endDate">To</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={endDate} />
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : (
        stats && (
          <>
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Home} label="Total Chalets" value={stats.totalChalets ?? "—"} />
              <StatCard icon={ShieldCheck} label="Active Chalets" value={stats.activeChalets ?? "—"} />
              <StatCard icon={Users} label="Customers" value={stats.totalCustomers ?? "—"} />
              <StatCard icon={Users} label="Chalet Admins" value={stats.totalChaletAdmins ?? "—"} />
              <StatCard icon={CalendarCheck} label="Total Bookings" value={stats.totalBookings ?? "—"} />
              <StatCard icon={Clock} label="Pending" value={stats.pendingCount ?? "—"} />
              <StatCard icon={CheckCircle2} label="Confirmed" value={stats.confirmedCount ?? "—"} />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completedCount ?? "—"} />
              <StatCard icon={XCircle} label="Rejected" value={stats.rejectedCount ?? "—"} />
              <StatCard icon={Ban} label="Cancelled" value={stats.cancelledCount ?? "—"} />
              <StatCard
                icon={Wallet}
                label="Total Revenue"
                value={typeof stats.totalRevenue === "number" ? formatCurrency(stats.totalRevenue) : "—"}
                hint="Paid amounts only"
              />
            </section>

            {Array.isArray(stats.topChaletsByRevenue) && stats.topChaletsByRevenue.length > 0 && (
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle>Top chalets by revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-5">
                  {stats.topChaletsByRevenue.map((c, i) => (
                    <div key={c.chaletId ?? i} className="flex items-center justify-between text-sm">
                      <span dir="auto" className="font-medium text-foreground">
                        {c.chaletName ?? `Chalet #${c.chaletId ?? i}`}
                      </span>
                      <span className="text-muted-foreground">
                        {typeof c.bookingsCount === "number" &&
                          `${c.bookingsCount} booking${c.bookingsCount === 1 ? "" : "s"} · `}
                        {typeof c.revenue === "number" ? formatCurrency(c.revenue) : "—"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )
      )}
    </div>
  );
}
