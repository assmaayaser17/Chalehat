import "server-only";

import { apiFetch, authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { AdvertisementCategory, CreateAdvertisementCategoryRequest } from "@/lib/api/types";

/** GET /api/advertisement-categories — public. */
export async function getAdvertisementCategories(): Promise<AdvertisementCategory[]> {
  const data = await apiFetch<unknown>("/api/advertisement-categories", {
    next: { revalidate: 60, tags: ["advertisement-categories"] },
  });
  return unwrapList<AdvertisementCategory>(data);
}

/** POST /api/advertisement-categories — SuperAdmin/SystemAdmin only. */
export async function createAdvertisementCategory(
  data: CreateAdvertisementCategoryRequest,
): Promise<AdvertisementCategory> {
  const result = await authFetch<unknown>("/api/advertisement-categories", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<AdvertisementCategory>(result);
}

/** DELETE /api/advertisement-categories/{id} — SuperAdmin/SystemAdmin only. */
export async function deleteAdvertisementCategory(id: number): Promise<void> {
  await authFetch<unknown>(`/api/advertisement-categories/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
