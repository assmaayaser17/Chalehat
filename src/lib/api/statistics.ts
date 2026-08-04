import "server-only";

import { authFetch, unwrapObject } from "@/lib/api/client";
import type { ChaletStatistics, SystemStatistics } from "@/lib/api/types";

/** GET /api/statistics/chalet/{chaletId}?startDate&endDate — ChaletAdmin (own chalet) only. */
export async function getChaletStatistics(
  chaletId: number,
  startDate: string,
  endDate: string,
): Promise<ChaletStatistics> {
  const data = await authFetch<unknown>(
    `/api/statistics/chalet/${chaletId}?startDate=${startDate}&endDate=${endDate}`,
    { cache: "no-store" },
  );
  return unwrapObject<ChaletStatistics>(data);
}

/** GET /api/statistics/system?startDate&endDate — SuperAdmin / SystemAdmin only. */
export async function getSystemStatistics(startDate: string, endDate: string): Promise<SystemStatistics> {
  const data = await authFetch<unknown>(`/api/statistics/system?startDate=${startDate}&endDate=${endDate}`, {
    cache: "no-store",
  });
  return unwrapObject<SystemStatistics>(data);
}
