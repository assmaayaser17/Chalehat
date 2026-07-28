import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BOOKING_TYPE_FLAGS, type BookingDayInput } from "@/lib/api/types";

/**
 * Merges Tailwind class names, resolving conflicts (last one wins).
 * Standard shadcn/ui helper used by every UI primitive.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number as Jordanian/Palestinian-style currency (JOD/ILS agnostic, just "amount + unit"). */
export function formatCurrency(amount: number, currency = "JOD") {
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

type BookingTypeKey = keyof typeof BOOKING_TYPE_FLAGS;
const BOOKING_TYPE_KEYS = Object.keys(BOOKING_TYPE_FLAGS) as BookingTypeKey[];

/** Shared with the booking form so the type a customer picks matches the badges shown on the chalet page. */
export const BOOKING_TYPE_LABELS: Record<BookingTypeKey, string> = {
  Daily: "Daily booking",
  Weekend: "Weekend getaway",
  Weekly: "Weekly booking",
};

/**
 * Resolves the booking types a chalet accepts. The API sends this field as a
 * bitmask number on create ("POST /Chalet") but as a label string like "All"
 * or "Daily,Weekend" when reading a chalet back — this reads either shape.
 */
export function getActiveBookingTypes(value: number | string): BookingTypeKey[] {
  if (typeof value === "string") {
    if (value === "All") return [...BOOKING_TYPE_KEYS];
    const requested = new Set(value.split(",").map((part) => part.trim()));
    return BOOKING_TYPE_KEYS.filter((key) => requested.has(key));
  }
  return BOOKING_TYPE_KEYS.filter((key) => (value & BOOKING_TYPE_FLAGS[key]) !== 0);
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
