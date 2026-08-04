import "server-only";

import { apiFetch, authFetch, unwrapList } from "@/lib/api/client";
import type { ChaletWeekdayPrice, CreateChaletWeekdayPriceRequest } from "@/lib/api/types";

/** GET /api/chalet/{id}/weekday-prices — public. */
export async function getChaletWeekdayPrices(chaletId: number): Promise<ChaletWeekdayPrice[]> {
  const data = await apiFetch<unknown>(`/api/chalet/${chaletId}/weekday-prices`, {
    cache: "no-store",
  });
  return unwrapList<ChaletWeekdayPrice>(data);
}

/** POST /api/chalet/{id}/weekday-prices — ChaletAdmin (own chalet) / SuperAdmin. */
export async function createChaletWeekdayPrice(
  chaletId: number,
  data: CreateChaletWeekdayPriceRequest,
): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/weekday-prices`, {
    method: "POST",
    body: data,
    cache: "no-store",
  });
}

/**
 * DELETE /api/chalet/{id}/weekday-prices/{priceId} — ChaletAdmin (own
 * chalet) / SuperAdmin. Mirrors the seasonal-prices delete endpoint; not in
 * the Postman collection, same as the rest of this resource.
 */
export async function deleteChaletWeekdayPrice(chaletId: number, priceId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/weekday-prices/${priceId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
