"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  approveBooking,
  getBookingConflicts,
  getCustomerBalance,
  markExpiredBookingsCompleted,
  recordBookingPayment,
  rejectBooking,
} from "@/lib/api/chalet-bookings";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";
import type { Booking, CustomerBalance } from "@/lib/api/types";

export async function approveBookingAction(
  bookingId: number,
  chaletId: number,
  refundWindowHours: number,
): Promise<ActionResult> {
  try {
    await approveBooking(bookingId, refundWindowHours);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while approving the booking." };
  }
  revalidateTag(`chalet-bookings-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/bookings`);
  return { success: true };
}

export type BookingConflictsResult =
  | { success: true; conflicts: Booking[] }
  | { success: false; message: string };

/** Other pending bookings for the same chalet with overlapping dates — see `getBookingConflicts`. */
export async function getBookingConflictsAction(bookingId: number): Promise<BookingConflictsResult> {
  try {
    const conflicts = await getBookingConflicts(bookingId);
    return { success: true, conflicts };
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "Couldn't check for conflicting bookings." };
  }
}

/**
 * Approves one booking out of a conflicting group and rejects the rest with
 * a shared reason — the backend doesn't do this automatically, so this is a
 * single combined action instead of making the admin reject each one by hand.
 * Partial failures (e.g. one reject call fails) are collected and reported,
 * but don't stop the remaining rejects from being attempted.
 */
export async function approveBookingAndRejectConflictsAction(
  bookingId: number,
  chaletId: number,
  refundWindowHours: number,
  conflictingBookingIds: number[],
  rejectReason: string,
): Promise<ActionResult> {
  if (!rejectReason.trim()) {
    return { success: false, message: "Enter a reason for rejecting the conflicting bookings." };
  }

  try {
    await approveBooking(bookingId, refundWindowHours);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while approving the booking." };
  }

  const failures: number[] = [];
  for (const conflictId of conflictingBookingIds) {
    try {
      await rejectBooking(conflictId, rejectReason);
    } catch {
      failures.push(conflictId);
    }
  }

  revalidateTag(`chalet-bookings-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/bookings`);

  if (failures.length > 0) {
    return {
      success: false,
      message: `Booking approved, but couldn't reject ${failures.length} conflicting booking(s) (#${failures.join(", #")}). Reject them manually below.`,
    };
  }
  return { success: true };
}

export async function rejectBookingAction(bookingId: number, chaletId: number, reason: string): Promise<ActionResult> {
  if (!reason.trim()) {
    return { success: false, message: "Enter a reason for the rejection." };
  }
  try {
    await rejectBooking(bookingId, reason);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while rejecting the booking." };
  }
  revalidateTag(`chalet-bookings-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/bookings`);
  return { success: true };
}

/** Bulk-transitions this chalet's past-due `Confirmed` bookings to `Completed` — nothing does this automatically. */
export async function markExpiredBookingsCompletedAction(chaletId: number): Promise<ActionResult> {
  try {
    await markExpiredBookingsCompleted(chaletId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while marking expired bookings as completed." };
  }
  revalidateTag(`chalet-bookings-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/bookings`);
  return { success: true };
}

export async function recordBookingPaymentAction(
  bookingId: number,
  chaletId: number,
  amount: number,
  paymentMethod: string,
): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: "Enter a payment amount greater than zero." };
  }
  if (!paymentMethod.trim()) {
    return { success: false, message: "Choose a payment method." };
  }
  try {
    await recordBookingPayment(bookingId, { amount, paymentMethod });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while recording the payment." };
  }
  revalidateTag(`chalet-bookings-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/bookings`);
  return { success: true };
}

export type CustomerBalanceResult =
  | { success: true; balance: CustomerBalance }
  | { success: false; message: string };

export async function getCustomerBalanceAction(customerId: string): Promise<CustomerBalanceResult> {
  try {
    const balance = await getCustomerBalance(customerId);
    return { success: true, balance };
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "Couldn't load this customer's balance." };
  }
}
