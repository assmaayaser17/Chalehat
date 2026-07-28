import "server-only";

import { apiFetch, authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { ChaletSeasonalPrice, LinkChaletSeasonalPriceRequest } from "@/lib/api/types";

/** GET /api/chalet/{id}/seasonal-prices — public. Seasons linked to this specific chalet. */
export async function getChaletSeasonalPrices(chaletId: number): Promise<ChaletSeasonalPrice[]> {
  const data = await apiFetch<unknown>(`/api/chalet/${chaletId}/seasonal-prices`, {
    cache: "no-store",
  });
  return unwrapList<ChaletSeasonalPrice>(data);
}

/** POST /api/chalet/{id}/seasonal-prices — ChaletAdmin (own chalet) / SuperAdmin. */
export async function linkChaletSeasonalPrice(
  chaletId: number,
  data: LinkChaletSeasonalPriceRequest,
): Promise<ChaletSeasonalPrice> {
  const result = await authFetch<unknown>(`/api/chalet/${chaletId}/seasonal-prices`, {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ChaletSeasonalPrice>(result);
}

/**
 * DELETE /api/chalet/{id}/seasonal-prices/{priceId} — ChaletAdmin (own chalet) / SuperAdmin.
 * Removes this chalet's price for that season; the season itself is untouched.
 */
export async function deleteChaletSeasonalPrice(chaletId: number, priceId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/seasonal-prices/${priceId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
