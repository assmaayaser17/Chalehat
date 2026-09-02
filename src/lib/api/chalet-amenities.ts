import "server-only";

import { authFetch, unwrapList } from "@/lib/api/client";
import type { Amenity } from "@/lib/api/types";

/** POST /api/Chalet/{id}/amenities — ChaletAdmin (own chalet) / SuperAdmin. Adds the given amenities to the chalet's existing list. */
export async function linkChaletAmenities(chaletId: number, amenityIds: number[]): Promise<Amenity[]> {
  const data = await authFetch<unknown>(`/api/Chalet/${chaletId}/amenities`, {
    method: "POST",
    body: { amenityIds },
    cache: "no-store",
  });
  return unwrapList<Amenity>(data);
}

/** DELETE /api/Chalet/{id}/amenities/{amenityId} — ChaletAdmin (own chalet) / SuperAdmin. Unlinks one amenity from the chalet. */
export async function unlinkChaletAmenity(chaletId: number, amenityId: number): Promise<void> {
  await authFetch<unknown>(`/api/Chalet/${chaletId}/amenities/${amenityId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
