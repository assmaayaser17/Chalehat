import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Booking } from "@/lib/api/types";

/** GET /api/Booking/chalet/{chaletId} — ChaletAdmin (own chalet) / SuperAdmin. */
export async function getChaletBookings(chaletId: number): Promise<Booking[]> {
  const data = await authFetch<unknown>(`/api/Booking/chalet/${chaletId}`, { cache: "no-store" });
  return unwrapList<Booking>(data);
}

/** PATCH /api/Booking/{id}/approve — ChaletAdmin (own chalet) / SuperAdmin. */
export async function approveBooking(bookingId: number, refundWindowHours: number): Promise<Booking> {
  const result = await authFetch<unknown>(`/api/Booking/${bookingId}/approve`, {
    method: "PATCH",
    body: { refundWindowHours },
    cache: "no-store",
  });
  return unwrapObject<Booking>(result);
}

/** PATCH /api/Booking/{id}/reject — ChaletAdmin (own chalet) / SuperAdmin. */
export async function rejectBooking(bookingId: number, reason: string): Promise<Booking> {
  const result = await authFetch<unknown>(`/api/Booking/${bookingId}/reject`, {
    method: "PATCH",
    body: { reason },
    cache: "no-store",
  });
  return unwrapObject<Booking>(result);
}
