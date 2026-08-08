"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { BookingCard, type EnrichedBooking } from "@/components/bookings/booking-card";

type Tab = "all" | "upcoming" | "past";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

const PAST_STATUSES = new Set(["Completed", "Rejected", "Cancelled"]);

function isPast(booking: EnrichedBooking) {
  if (PAST_STATUSES.has(booking.status)) return true;
  const days = booking.days ?? [];
  const lastDay = days[days.length - 1];
  if (!lastDay) return false;
  return new Date(lastDay.date) < new Date(new Date().toDateString());
}

/** Client Component: renders the my-bookings grid behind All/Upcoming/Past filter tabs. */
export function MyBookingsGrid({ bookings }: { bookings: EnrichedBooking[] }) {
  const [tab, setTab] = React.useState<Tab>("all");

  const filtered = bookings.filter((booking) => {
    if (tab === "all") return true;
    return tab === "past" ? isPast(booking) : !isPast(booking);
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          No bookings in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
