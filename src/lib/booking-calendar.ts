import type { ChaletCalendarDay } from "@/lib/api/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** All UTC-anchored — see the same rationale as `buildBookingDays` in lib/utils.ts. */
export function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    startDate: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`,
    endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    daysInMonth: end.getUTCDate(),
    firstWeekday: start.getUTCDay(),
  };
}

/**
 * `GET /api/Booking/chalet/{id}` returns each booking's own `days` as an
 * empty array even for real Confirmed bookings — the per-day breakdown only
 * actually shows up per-date on the calendar endpoint, keyed the other way
 * around (date -> slots -> bookingId). This inverts that into
 * bookingId -> sorted dates so the bookings table can show real dates for
 * whatever range the calendar was fetched for. Returns a plain object (not
 * a Map) since this crosses the Server -> Client Component boundary.
 */
export function buildBookingDatesById(days: ChaletCalendarDay[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const day of days) {
    if (typeof day?.date !== "string") continue;
    const dateOnly = day.date.slice(0, 10);
    for (const slot of day.slots ?? []) {
      if (typeof slot?.bookingId !== "number") continue;
      const key = String(slot.bookingId);
      (map[key] ??= []).push(dateOnly);
    }
  }
  for (const key of Object.keys(map)) map[key]?.sort();
  return map;
}
