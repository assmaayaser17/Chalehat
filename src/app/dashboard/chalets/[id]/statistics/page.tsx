import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Percent,
  Star,
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
import { getChaletById } from "@/lib/api/chalet";
import { getChaletStatistics } from "@/lib/api/statistics";
import { BOOKING_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import type { BookingType } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export const metadata: Metadata = { title: "Chalet Statistics" };

function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function bookingTypeLabel(value?: string): string {
  if (!value) return "—";
  return BOOKING_TYPE_LABELS[value as BookingType] ?? value;
}

export default async function ChaletStatisticsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { startDate: startDateParam, endDate: endDateParam } = await searchParams;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

  const currentYear = new Date().getUTCFullYear();
  const startDate = isIsoDate(startDateParam) ? startDateParam : `${currentYear}-01-01`;
  const endDate = isIsoDate(endDateParam) ? endDateParam : `${currentYear}-12-31`;

  let chalet;
  try {
    chalet = await getChaletById(chaletId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let stats: Awaited<ReturnType<typeof getChaletStatistics>> | null = null;
  let errorMessage: string | null = null;
  try {
    stats = await getChaletStatistics(chaletId, startDate, endDate);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load statistics for this chalet.";
  }

  const maxMonthlyBookings = Math.max(1, ...(stats?.monthlyBreakdown ?? []).map((m) => m.bookingsCount ?? 0));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title={`Statistics — ${chalet.name}`} description="Performance for this chalet over a chosen period." />

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
              <StatCard
                icon={Percent}
                label="Occupancy"
                value={
                  typeof stats.occupancyRatePercentage === "number" ? `${stats.occupancyRatePercentage}%` : "—"
                }
              />
              {(stats.reviewsCount ?? 0) > 0 && (
                <StatCard
                  icon={Star}
                  label="Rating"
                  value={typeof stats.averageRating === "number" ? stats.averageRating.toFixed(1) : "—"}
                  hint={`${stats.reviewsCount} review${stats.reviewsCount === 1 ? "" : "s"}`}
                />
              )}
            </section>

            {stats.monthlyBreakdown && stats.monthlyBreakdown.length > 0 && (
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle>Bookings by month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-5">
                  {stats.monthlyBreakdown.map((m) => (
                    <div key={m.monthLabel ?? `${m.year}-${m.month}`} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">{m.monthLabel ?? "—"}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary-600"
                          style={{ width: `${((m.bookingsCount ?? 0) / maxMonthlyBookings) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-end text-xs font-semibold tabular-nums text-foreground">
                        {m.bookingsCount ?? 0}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {stats.bookingTypeBreakdown && stats.bookingTypeBreakdown.length > 0 && (
                <Card>
                  <CardHeader className="border-b border-border">
                    <CardTitle>By booking type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-5">
                    {stats.bookingTypeBreakdown.map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{bookingTypeLabel(row.bookingType)}</span>
                        <span className="text-muted-foreground">
                          {row.bookingsCount ?? 0} booking{row.bookingsCount === 1 ? "" : "s"}
                          {typeof row.revenue === "number" && row.revenue > 0 && ` · ${formatCurrency(row.revenue)}`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats.paymentMethodBreakdown && stats.paymentMethodBreakdown.length > 0 && (
                <Card>
                  <CardHeader className="border-b border-border">
                    <CardTitle>By payment method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-5">
                    {stats.paymentMethodBreakdown.map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{row.paymentMethod ?? "—"}</span>
                        <span className="text-muted-foreground">
                          {row.bookingsCount ?? 0} booking{row.bookingsCount === 1 ? "" : "s"}
                          {typeof row.revenue === "number" && row.revenue > 0 && ` · ${formatCurrency(row.revenue)}`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {stats.topCustomers && stats.topCustomers.length > 0 && (
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle>Top customers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-5">
                  {stats.topCustomers.map((c, i) => (
                    <div key={c.userId ?? i} className="flex items-center justify-between text-sm">
                      <span dir="auto" className="font-medium text-foreground">
                        {c.fullName || "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {c.bookingsCount ?? 0} booking{c.bookingsCount === 1 ? "" : "s"}
                        {typeof c.totalSpent === "number" && c.totalSpent > 0 && ` · ${formatCurrency(c.totalSpent)}`}
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
