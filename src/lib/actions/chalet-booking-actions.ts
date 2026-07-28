"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { approveBooking, rejectBooking } from "@/lib/api/chalet-bookings";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

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
