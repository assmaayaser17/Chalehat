import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { MyBookingsGrid } from "@/components/bookings/my-bookings-grid";
import type { EnrichedBooking } from "@/components/bookings/booking-card";
import { ApiError } from "@/lib/api/client";
import { getMyBookings } from "@/lib/api/booking";
import { getChaletById } from "@/lib/api/chalet";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Bookings" };

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/my-bookings");
  if (session.role !== "Customer") redirect("/");

  let bookings: EnrichedBooking[] = [];
  let errorMessage: string | null = null;
  try {
    const rawBookings = await getMyBookings();

    const chaletIds = [...new Set(rawBookings.map((b) => b.chaletId))];
    const chaletResults = await Promise.allSettled(chaletIds.map((id) => getChaletById(id)));
    const chaletsById = new Map(
      chaletResults
        .map((result, i) => (result.status === "fulfilled" ? ([chaletIds[i], result.value] as const) : null))
        .filter((entry): entry is readonly [number, Awaited<ReturnType<typeof getChaletById>>] => entry !== null),
    );

    bookings = rawBookings.map((booking) => ({ ...booking, chalet: chaletsById.get(booking.chaletId) ?? null }));
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load your bookings.";
  }

  return (
    <div className="container max-w-6xl space-y-6 py-10">
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
        <MyBookingsGrid bookings={bookings} />
      )}
    </div>
  );
}
