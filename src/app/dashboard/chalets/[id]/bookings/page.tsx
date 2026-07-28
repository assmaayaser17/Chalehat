import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ChaletBookingsManager } from "@/components/chalets/chalet-bookings-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getChaletBookings } from "@/lib/api/chalet-bookings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Bookings" };

export default async function ChaletBookingsPage({ params }: PageProps) {
  const { id } = await params;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

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

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title={`Bookings — ${chalet.name}`} description="Approve or reject booking requests for this chalet." />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Bookings</CardTitle>
          <CardDescription>{errorMessage ? "Couldn't load bookings." : `${bookings.length} bookings so far.`}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <ChaletBookingsManager chaletId={chaletId} bookings={bookings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
