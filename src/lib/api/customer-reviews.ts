import "server-only";

import { authFetch, unwrapObject, unwrapPaginated } from "@/lib/api/client";
import type { CustomerBookingStats, CustomerReviewRecord, PaginatedResult } from "@/lib/api/types";

/** GET /api/admin/users/{userId}/reviews/booking-stats — confirmed via a live call. SuperAdmin / SystemAdmin / ChaletAdmin. */
export async function getCustomerBookingStats(userId: string): Promise<CustomerBookingStats> {
  const data = await authFetch<unknown>(`/api/admin/users/${userId}/reviews/booking-stats`, { cache: "no-store" });
  return unwrapObject<CustomerBookingStats>(data);
}

/**
 * GET /api/admin/customer-reviews/all?minDisturbanceRating&page&pageSize —
 * documented as SuperAdmin/SystemAdmin only, but a live call with a
 * ChaletAdmin token also returned 200 (with results scoped to nothing, in
 * that test) rather than 403 — left open to any dashboard role here and
 * degraded gracefully if the backend does reject it for a given account.
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
