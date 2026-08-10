"use server";

import { revalidateTag } from "next/cache";
import { addCustomerReview, getCustomerBookingStats } from "@/lib/api/customer-reviews";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";
import type { CustomerBookingStats } from "@/lib/api/types";

export type CustomerBookingStatsResult =
  | { success: true; stats: CustomerBookingStats }
  | { success: false; message: string };

export async function getCustomerBookingStatsAction(userId: string): Promise<CustomerBookingStatsResult> {
  try {
    const stats = await getCustomerBookingStats(userId);
    return { success: true, stats };
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "Couldn't load this customer's booking history." };
  }
}

/**
 * Only ever called from a chalet's own bookings page (`ChaletBookingsManager`),
 * where `chaletId` and the fact that this customer has a booking there are
 * already guaranteed by construction — that's what satisfies the API's "own
 * chalet's customers only" rule for a ChaletAdmin.
 */
export async function addCustomerReviewAction(
  userId: string,
  chaletId: number,
  cleanlinessRating: number,
  disturbanceRating: number,
  paymentReliabilityRating: number,
  notes: string,
): Promise<ActionResult> {
  for (const [label, value] of [
    ["cleanliness", cleanlinessRating],
    ["disturbance", disturbanceRating],
    ["payment reliability", paymentReliabilityRating],
  ] as const) {
    if (value < 1 || value > 5) {
      return { success: false, message: `Choose a ${label} rating between 1 and 5.` };
    }
  }

  try {
    await addCustomerReview(userId, { chaletId, cleanlinessRating, disturbanceRating, paymentReliabilityRating, notes });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while submitting the review." };
  }
  revalidateTag(`chalet-bookings-${chaletId}`);
  return { success: true };
}
