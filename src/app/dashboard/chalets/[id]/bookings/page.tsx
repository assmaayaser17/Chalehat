import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ChaletBookingsManager } from "@/components/chalets/chalet-bookings-manager";
import { ChaletCalendarView } from "@/components/chalets/chalet-calendar-view";
import { MarkExpiredCompletedButton } from "@/components/chalets/mark-expired-completed-button";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getChaletBookings, getChaletCalendar } from "@/lib/api/chalet-bookings";
import { getUsersByRole } from "@/lib/api/admin";
import { buildBookingDatesById, monthRange } from "@/lib/booking-calendar";
import type { ChaletCalendarDay } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

export const metadata: Metadata = { title: "Chalet Bookings" };

export default async function ChaletBookingsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const parts = monthParam.split("-").map(Number);
    year = parts[0] ?? year;
    month = (parts[1] ?? month + 1) - 1;
  }

  let chalet;
  try {
    chalet = await getChaletById(chaletId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let bookings: Awaited<ReturnType<typeof getChaletBookings>> = [];
  let errorMessage: string | null = null;
  try {
    bookings = await getChaletBookings(chaletId);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load bookings for this chalet.";
  }

  // Fetched once and reused for both the calendar grid and the bookings
  // table's Dates column — `GET /api/Booking/chalet/{id}` returns each
  // booking's own `days` as an empty array, but the calendar endpoint has
  // the real per-date breakdown, see `buildBookingDatesById`.
  const { startDate, endDate } = monthRange(year, month);
  let calendarDays: ChaletCalendarDay[] = [];
  let calendarFailed = false;
  try {
    calendarDays = await getChaletCalendar(chaletId, startDate, endDate);
  } catch {
    calendarFailed = true;
  }
  const bookingDatesById = buildBookingDatesById(calendarDays);

  // `GET /api/Booking/chalet/{id}` returns `userFullName` blank for most
  // bookings — confirmed live, see the `Booking` type's doc comment. There's
  // no fix on the booking endpoint itself, but `GET /api/Admin/by-role/Customer`
  // (open to ChaletAdmin too, per the API docs) does return real names, so
  // names are backfilled here by matching `booking.userId` against it.
  let customerNamesById: Record<string, string> = {};
  try {
    const customers = await getUsersByRole("Customer");
    customerNamesById = Object.fromEntries(customers.map((customer) => [customer.id, customer.fullName]));
  } catch {
    // Non-critical — `ChaletBookingsManager` already falls back to `#id` when a name isn't available.
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title={`Bookings — ${chalet.name}`}
        description="Approve or reject booking requests for this chalet."
        actions={<MarkExpiredCompletedButton chaletId={chaletId} />}
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Availability calendar</CardTitle>
          <CardDescription>Days already booked for this chalet.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ChaletCalendarView
            year={year}
            month={month}
            basePath={`/dashboard/chalets/${chaletId}/bookings`}
            days={calendarDays}
            failed={calendarFailed}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            {errorMessage
              ? "Couldn't load bookings."
              : `${bookings.length} bookings so far. Dates shown are limited to the month displayed above.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <ChaletBookingsManager
              chaletId={chaletId}
              bookings={bookings}
              bookingDatesById={bookingDatesById}
              customerNamesById={customerNamesById}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
