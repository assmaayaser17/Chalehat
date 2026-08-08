import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { LeaveReviewForm } from "@/components/bookings/leave-review-form";
import { BOOKING_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import type { Booking, BookingType, Chalet } from "@/lib/api/types";

export type EnrichedBooking = Booking & { chalet: Chalet | null };

/**
 * Pure presentation — matches the visual language of `ChaletCard` so bookings
 * and browse listings feel like one system.
 *
 * Shows booking type + guest count instead of stay dates: `/api/Booking/my-bookings`
 * always returns `days: []` and omits `createdAt` entirely (confirmed live),
 * and there's no customer-usable endpoint to backfill either — see the note
 * on the `Booking` type. Revisit once the backend actually populates them.
 */
export function BookingCard({ booking }: { booking: EnrichedBooking }) {
  const link = `/chalets/${booking.chaletId}`;
  const bookingTypeLabel = booking.bookingType
    ? (BOOKING_TYPE_LABELS[booking.bookingType as BookingType] ?? booking.bookingType)
    : null;
  const image = booking.chalet?.coverImageUrl ?? booking.chalet?.images?.find((img) => img.isApproved)?.url;
  const name = booking.chaletName ?? booking.chalet?.name ?? `Chalet #${booking.chaletId}`;

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={link} className="relative block aspect-[16/10] w-full overflow-hidden bg-primary-50">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-300">
            <svg viewBox="0 0 48 48" className="h-14 w-14" aria-hidden="true">
              <path
                d="M13 26 24 19l11 7v9a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1v-9Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        {typeof booking.chalet?.averageRating === "number" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-primary-800 shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
            {booking.chalet.averageRating.toFixed(1)}
          </div>
        )}
      </Link>

      <CardContent dir="auto" className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={link}>
              <h3 className="line-clamp-1 font-semibold text-primary-800 transition-colors group-hover:text-primary-700">
                {name}
              </h3>
            </Link>
            {booking.chalet?.address && (
              <p className="mt-0.5 line-clamp-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {booking.chalet.address}
              </p>
            )}
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Booking</p>
            <p className="flex items-center gap-1 text-sm font-medium">
              {bookingTypeLabel && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                  {bookingTypeLabel}
                </span>
              )}
              {typeof booking.childrenCount === "number" && booking.childrenCount > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  {booking.childrenCount}
                </span>
              )}
            </p>
          </div>
          {typeof booking.totalPrice === "number" && (
            <div className="text-end">
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="text-lg font-bold tabular-nums text-accent-700">{formatCurrency(booking.totalPrice)}</p>
            </div>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={link}>View details</Link>
        </Button>

        {booking.status === "Completed" && <LeaveReviewForm bookingId={booking.id} />}
      </CardContent>
    </Card>
  );
}
