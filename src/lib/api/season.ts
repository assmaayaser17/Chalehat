import "server-only";

import { apiFetch, authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { CreateSeasonRequest, Season } from "@/lib/api/types";

/** GET /api/Season — public. Every season defined in the system, independent of any chalet. */
export async function getAllSeasons(): Promise<Season[]> {
  const data = await apiFetch<unknown>("/api/Season", {
    next: { revalidate: 60, tags: ["seasons"] },
  });
  return unwrapList<Season>(data);
}

/**
 * POST /api/Season — SuperAdmin only. The API rejects dates that overlap an
 * existing season ("overlaps with an existing season").
 */
export async function createSeason(data: CreateSeasonRequest): Promise<Season> {
  const result = await authFetch<unknown>("/api/Season", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Season>(result);
}

/** DELETE /api/Season/{id} — SuperAdmin/SystemAdmin only. */
export async function deleteSeason(id: number): Promise<void> {
  await authFetch<unknown>(`/api/Season/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
