import "server-only";

import { authFetch } from "@/lib/api/client";
import type { CreateChaletWeekdayPriceRequest } from "@/lib/api/types";

/**
 * POST /api/chalet/{id}/weekday-prices — ChaletAdmin (own chalet) / SuperAdmin.
 * Sets a price for specific days of the week, independent of any season.
 * No GET or DELETE endpoint is documented for this resource, so a rule
 * can't be listed or removed once added — see `ChaletWeekdayPriceForm`.
 */
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
