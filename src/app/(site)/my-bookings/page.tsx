import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { ApiError } from "@/lib/api/client";
import { getMyBookings } from "@/lib/api/booking";
import { getSession } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bookings" };

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/my-bookings");
  if (session.role !== "Customer") redirect("/");

  let bookings: Awaited<ReturnType<typeof getMyBookings>> = [];
  let errorMessage: string | null = null;
  try {
    bookings = await getMyBookings();
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load your bookings.";
  }

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground">Track the status of every chalet you&apos;ve booked.</p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          You haven&apos;t booked a chalet yet.{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Browse chalets
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const days = booking.days ?? [];
            const firstDay = days[0];
            const lastDay = days[days.length - 1];
            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-semibold text-foreground">
                      {booking.chaletName ?? `Chalet #${booking.chaletId}`}
                    </p>
                    {firstDay && (
                      <p className="text-sm text-muted-foreground">
                        {formatDate(firstDay.date)}
                        {lastDay && lastDay.date !== firstDay.date && ` – ${formatDate(lastDay.date)}`}
                      </p>
                    )}
                    {booking.createdAt && (
                      <p className="text-xs text-muted-foreground">Booked on {formatDate(booking.createdAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof booking.totalPrice === "number" && (
                      <span className="font-medium text-foreground">{formatCurrency(booking.totalPrice)}</span>
                    )}
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
