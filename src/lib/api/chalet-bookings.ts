import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Booking, ChaletCalendarDay, CustomerBalance, RecordBookingPaymentRequest } from "@/lib/api/types";

/** GET /api/Booking/chalet/{chaletId} — ChaletAdmin (own chalet) / SuperAdmin. */
export async function getChaletBookings(chaletId: number): Promise<Booking[]> {
  const data = await authFetch<unknown>(`/api/Booking/chalet/${chaletId}`, { cache: "no-store" });
  return unwrapList<Booking>(data);
}

/**
 * GET /api/Booking/{id} — ChaletAdmin (own chalet) / SuperAdmin / SystemAdmin.
 * Used to resolve a booking notification's `relatedBookingId` down to the
 * `chaletId` needed to deep-link into that chalet's bookings page.
 */
export async function getBookingById(bookingId: number): Promise<Booking> {
  const data = await authFetch<unknown>(`/api/Booking/${bookingId}`, { cache: "no-store" });
  return unwrapObject<Booking>(data);
}

/**
 * GET /api/Booking/{id}/conflicts — ChaletAdmin (own chalet) / SuperAdmin.
 * Other bookings for the same chalet with overlapping dates (excludes the
 * booking being queried). The backend does NOT auto-resolve these when one
 * is approved — the admin has to reject the rest explicitly, see
 * `approveBookingAndRejectConflictsAction`.
 */
export async function getBookingConflicts(bookingId: number): Promise<Booking[]> {
  const data = await authFetch<unknown>(`/api/Booking/${bookingId}/conflicts`, { cache: "no-store" });
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

/**
 * POST /api/Booking/mark-expired-completed/chalet/{chaletId} — ChaletAdmin
 * (own chalet) / SuperAdmin. Bulk-transitions this chalet's past-due
 * `Confirmed` bookings to `Completed`; nothing does this automatically.
 */
export async function markExpiredBookingsCompleted(chaletId: number): Promise<void> {
  await authFetch<unknown>(`/api/Booking/mark-expired-completed/chalet/${chaletId}`, {
    method: "POST",
    cache: "no-store",
  });
}

/** POST /api/Booking/{id}/pay — ChaletAdmin (own chalet) / SuperAdmin / SystemAdmin. Records a payment against the booking. */
export async function recordBookingPayment(bookingId: number, data: RecordBookingPaymentRequest): Promise<Booking> {
  const result = await authFetch<unknown>(`/api/Booking/${bookingId}/pay`, {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Booking>(result);
}

/** GET /api/Booking/customer/{customerId}/balance — ChaletAdmin (own chalet) / SuperAdmin / SystemAdmin. */
export async function getCustomerBalance(customerId: string): Promise<CustomerBalance> {
  const data = await authFetch<unknown>(`/api/Booking/customer/${customerId}/balance`, { cache: "no-store" });
  return unwrapObject<CustomerBalance>(data);
}

/**
 * GET /api/Booking/chalet/{chaletId}/calendar?startDate&endDate — ChaletAdmin
 * (own chalet) / SuperAdmin. Response shape unverified (see `ChaletCalendarDay`).
 */
export async function getChaletCalendar(
  chaletId: number,
  startDate: string,
  endDate: string,
): Promise<ChaletCalendarDay[]> {
  const data = await authFetch<unknown>(
    `/api/Booking/chalet/${chaletId}/calendar?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );
  return unwrapList<ChaletCalendarDay>(data);
}
