import "server-only";

import { apiFetch, authFetch, resolveMediaUrl, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Advertisement, UpdateAdvertisementRequest } from "@/lib/api/types";

/** Normalizes `Advertisement.images` (shape unconfirmed — see the type's doc comment) into resolved URLs. */
function resolveAdvertisementImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => {
      if (typeof image === "string") return resolveMediaUrl(image);
      if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
        return resolveMediaUrl(image.url);
      }
      return null;
    })
    .filter((url): url is string => url !== null);
}

function resolveAdvertisement(ad: Advertisement): Advertisement & { images: string[] } {
  return { ...ad, images: resolveAdvertisementImages(ad.images) };
}

/** GET /api/advertisements — public. */
export async function getAdvertisements(): Promise<(Advertisement & { images: string[] })[]> {
  const data = await apiFetch<unknown>("/api/advertisements", {
    next: { revalidate: 60, tags: ["advertisements"] },
  });
  return unwrapList<Advertisement>(data).map(resolveAdvertisement);
}

/** GET /api/advertisements/{id} — public. */
export async function getAdvertisementById(id: number): Promise<Advertisement & { images: string[] }> {
  const data = await apiFetch<unknown>(`/api/advertisements/${id}`, {
    next: { revalidate: 60, tags: ["advertisements", `advertisement-${id}`] },
  });
  return resolveAdvertisement(unwrapObject<Advertisement>(data));
}

/**
 * POST /api/advertisements — multipart upload, SuperAdmin/SystemAdmin only.
 * `formData` is built by the caller with the exact field names the API
 * expects (`Name`, `description`, `price`, `categoryId`, `location`,
 * `phoneNumber`, one or more `images`) and forwarded as-is.
 */
export async function createAdvertisement(formData: FormData): Promise<Advertisement> {
  const result = await authFetch<unknown>("/api/advertisements", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  return unwrapObject<Advertisement>(result);
}

/** PUT /api/advertisements/{id} — SuperAdmin/SystemAdmin only. */
export async function updateAdvertisement(id: number, data: UpdateAdvertisementRequest): Promise<Advertisement> {
  const result = await authFetch<unknown>(`/api/advertisements/${id}`, {
    method: "PUT",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Advertisement>(result);
}

/** DELETE /api/advertisements/{id} — SuperAdmin/SystemAdmin only. */
export async function deleteAdvertisement(id: number): Promise<void> {
  await authFetch<unknown>(`/api/advertisements/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
