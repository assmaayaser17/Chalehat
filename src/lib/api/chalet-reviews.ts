import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { ChaletReview, CreateChaletReviewRequest } from "@/lib/api/types";

/** POST /api/chalet-reviews — Customer, must own the (Completed) booking being reviewed. */
export async function createChaletReview(data: CreateChaletReviewRequest): Promise<ChaletReview> {
  const result = await authFetch<unknown>("/api/chalet-reviews", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ChaletReview>(result);
}

/** GET /api/chalet-reviews/chalet/{chaletId}/pending — ChaletAdmin (own chalet) / SuperAdmin. */
export async function getPendingChaletReviews(chaletId: number): Promise<ChaletReview[]> {
  const data = await authFetch<unknown>(`/api/chalet-reviews/chalet/${chaletId}/pending`, { cache: "no-store" });
  return unwrapList<ChaletReview>(data);
}

/** PATCH /api/chalet-reviews/{id}/approve — ChaletAdmin (own chalet) / SuperAdmin. */
export async function approveChaletReview(reviewId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet-reviews/${reviewId}/approve`, {
    method: "PATCH",
    cache: "no-store",
  });
}
