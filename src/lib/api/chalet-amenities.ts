import "server-only";

import { authFetch, unwrapList } from "@/lib/api/client";
import type { Amenity } from "@/lib/api/types";

/**
 * POST /api/Chalet/{id}/amenities — ChaletAdmin (own chalet) / SuperAdmin.
 * Adds the given amenities to the chalet's existing list — the API has no
 * "unlink" endpoint, this can only add.
 */
export async function linkChaletAmenities(chaletId: number, amenityIds: number[]): Promise<Amenity[]> {
  const data = await authFetch<unknown>(`/api/Chalet/${chaletId}/amenities`, {
    method: "POST",
    body: { amenityIds },
    cache: "no-store",
  });
  return unwrapList<Amenity>(data);
}
