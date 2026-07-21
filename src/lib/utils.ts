import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BOOKING_TYPE_FLAGS } from "@/lib/api/types";

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

/** Returns initials (up to 2 letters) for an avatar fallback. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + second).toUpperCase();
}
