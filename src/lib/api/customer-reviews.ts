import "server-only";

import { authFetch, unwrapObject, unwrapPaginated } from "@/lib/api/client";
import type { AddCustomerReviewRequest, CustomerBookingStats, CustomerReviewRecord, PaginatedResult } from "@/lib/api/types";

/**
 * POST /api/admin/users/{userId}/reviews/reviews — SuperAdmin/SystemAdmin/ChaletAdmin.
 * Confirmed live via Postman (201 Created): the path really does repeat
 * "reviews" twice — that isn't a typo. The response is just
 * `{ success, message }`, not a review record, so it doesn't return one.
 */
export async function addCustomerReview(userId: string, data: AddCustomerReviewRequest): Promise<void> {
  await authFetch<unknown>(`/api/admin/users/${userId}/reviews/reviews`, {
    method: "POST",
    body: data,
    cache: "no-store",
  });
}

/** GET /api/admin/users/{userId}/reviews/booking-stats — confirmed via a live call. SuperAdmin / SystemAdmin / ChaletAdmin. */
export async function getCustomerBookingStats(userId: string): Promise<CustomerBookingStats> {
  const data = await authFetch<unknown>(`/api/admin/users/${userId}/reviews/booking-stats`, { cache: "no-store" });
  return unwrapObject<CustomerBookingStats>(data);
}

/**
 * GET /api/admin/customer-reviews/all?minDisturbanceRating&page&pageSize —
 * SuperAdmin/SystemAdmin only. Confirmed live: a ChaletAdmin token gets a
 * 403 here, matching the endpoint's own Postman description. Don't wire
 * this into anything a ChaletAdmin can reach — see `dashboard-nav.tsx`.
 */
export async function getAllCustomerReviews(
  page: number,
  pageSize: number,
  minDisturbanceRating?: number,
): Promise<PaginatedResult<CustomerReviewRecord>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (typeof minDisturbanceRating === "number") {
    params.set("minDisturbanceRating", String(minDisturbanceRating));
  }
  const data = await authFetch<unknown>(`/api/admin/customer-reviews/all?${params.toString()}`, {
    cache: "no-store",
  });
  return unwrapPaginated<CustomerReviewRecord>(data);
}
