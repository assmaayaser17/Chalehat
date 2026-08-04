"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { approveChaletReview, createChaletReview } from "@/lib/api/chalet-reviews";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

export async function createChaletReviewAction(bookingId: number, rating: number, comment: string): Promise<ActionResult> {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { success: false, message: "Choose a rating between 1 and 5." };
  }
  try {
    await createChaletReview({ bookingId, rating, comment });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while submitting your review." };
  }
  revalidatePath("/my-bookings");
  return { success: true };
}

export async function approveChaletReviewAction(reviewId: number, chaletId: number): Promise<ActionResult> {
  try {
    await approveChaletReview(reviewId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while approving the review." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/reviews`);
  revalidatePath(`/chalets/${chaletId}`);
  return { success: true };
}
