import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BOOKING_TYPES, type BookingDayInput, type BookingType } from "@/lib/api/types";

/**
 * Merges Tailwind class names, resolving conflicts (last one wins).
 * Standard shadcn/ui helper used by every UI primitive.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number as Israeli new shekel currency (the API has no currency field — every amount is just a raw number). */
export function formatCurrency(amount: number, currency = "NIS") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats an ISO date/time string as a short date. */
export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Shared with the booking form so the type a customer picks matches the badges shown on the chalet page. */
export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  Family: "Family",
  Youth: "Youth",
  Event: "Event",
};

/**
 * Maps a booking day's `period` to a display label. Confirmed live as a
 * string ("Morning"/"Evening"/"FullDay") on `GET /api/Booking/chalet/{id}`.
 * Some older bookings reportedly return a bare numeric string instead (see
 * `ChaletCalendarSlot`'s doc comment) — an unrecognized value falls back to
 * showing the raw value rather than guessing at a mapping.
 */
export function formatBookingPeriod(period: string): string {
  switch (period) {
    case "Morning":
      return "Morning";
    case "Evening":
      return "Evening";
    case "FullDay":
      return "Full day";
    default:
      return period;
  }
}

/** Summarizes a booking's day periods into one short label — e.g. "Full day" when every day matches, or a de-duplicated list ("Full day, Morning") when they differ. */
export function summarizeBookingPeriods(days: { period: string }[] | undefined): string {
  if (!days || days.length === 0) return "—";
  const labels = Array.from(new Set(days.map((d) => formatBookingPeriod(d.period))));
  return labels.join(", ");
}

/** .NET `DayOfWeek` numbering (Sunday = 0 ... Saturday = 6) — used to build the weekday-price create request. */
export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/**
 * Resolves the booking types a chalet accepts. Create sends this field as a
 * `BookingType[]`; reads may come back as that same array, a label string
 * like "All", or a comma-separated string ("Family,Youth") — this handles
 * all three shapes.
 */
export function getActiveBookingTypes(value: BookingType[] | string): BookingType[] {
  if (Array.isArray(value)) return value;
  if (value === "All") return [...BOOKING_TYPES];
  const requested = new Set(value.split(",").map((part) => part.trim()));
  return BOOKING_TYPES.filter((key) => requested.has(key));
}

/**
 * Expands a check-in/check-out date range (both inclusive) into the
 * `days` array the Booking API expects — one entry per calendar date.
 * Every day is sent with `period: 3`; see the note on `BookingDayInput`.
 *
 * Built entirely on UTC-anchored `Date` values (`Date.UTC` + `getUTC*`/
 * `setUTC*`) rather than local-time parsing — `new Date("2026-08-01T00:00:00")`
 * is local midnight, and `.toISOString()` re-expresses that in UTC, which
 * silently shifts the date backward a day for anyone east of UTC (e.g.
 * Palestine, this app's own market). Never reintroduce a local-time step here.
 */
function parseIsoDateParts(value: string): [number, number, number] {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return [year, month, day];
}

export function buildBookingDays(startDate: string, endDate: string): BookingDayInput[] {
  const [startYear, startMonth, startDay] = parseIsoDateParts(startDate);
  const [endYear, endMonth, endDay] = parseIsoDateParts(endDate);

  const days: BookingDayInput[] = [];
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  while (cursor.getTime() <= end.getTime()) {
    days.push({ date: cursor.toISOString().slice(0, 10), period: 3 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Returns initials (up to 2 letters) for an avatar fallback. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + second).toUpperCase();
}
