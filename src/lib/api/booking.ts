import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Booking, BookingPreview, CreateBookingRequest, PreviewBookingRequest } from "@/lib/api/types";

/** POST /api/Booking/preview — Customer only. Returns the price without creating a booking. */
export async function previewBooking(data: PreviewBookingRequest): Promise<BookingPreview> {
  const result = await authFetch<unknown>("/api/Booking/preview", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<BookingPreview>(result);
}

/** POST /api/Booking — Customer only. Creates the booking (starts out Pending, awaiting the chalet admin). */
export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  const result = await authFetch<unknown>("/api/Booking", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Booking>(result);
}

/** GET /api/Booking/my-bookings — Customer only. */
export async function getMyBookings(): Promise<Booking[]> {
  const data = await authFetch<unknown>("/api/Booking/my-bookings", { cache: "no-store" });
  return unwrapList<Booking>(data);
}
