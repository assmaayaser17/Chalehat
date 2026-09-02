import "server-only";

import { apiFetch, authFetch, resolveMediaUrl, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Advertisement, AdvertisementImage, UpdateAdvertisementRequest } from "@/lib/api/types";

/**
 * Normalizes `Advertisement.images` (shape unconfirmed — see the type's doc
 * comment) into `{id, url}` pairs. The `id` is what `reorderAdvertisementImages`/
 * `deleteAdvertisementImage` take — a bare string-array shape has no real id,
 * so that case falls back to the array index (reorder/delete will silently
 * misbehave for that shape; re-confirm against a live response if so).
 */
function resolveAdvertisementImages(images: unknown): AdvertisementImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image, index): AdvertisementImage | null => {
      if (typeof image === "string") {
        const url = resolveMediaUrl(image);
        return url ? { id: index, url } : null;
      }
      if (image && typeof image === "object") {
        const obj = image as Record<string, unknown>;
        const rawUrl = obj.url ?? obj.Url ?? obj.imageUrl ?? obj.ImageUrl;
        const rawId = obj.id ?? obj.Id;
        const url = typeof rawUrl === "string" ? resolveMediaUrl(rawUrl) : null;
        if (!url) return null;
        return { id: typeof rawId === "number" ? rawId : index, url };
      }
      return null;
    })
    .filter((image): image is AdvertisementImage => image !== null);
}

/**
 * `location` has shown up blank on the edit form for at least one live ad
 * even though every other field rendered fine — since `unwrapObject` never
 * remaps casing, that's consistent with the backend returning `Location`
 * (capital) instead of `location` for some records. Defensively check both,
 * matching the pattern already used for images above and for user roles
 * elsewhere in this codebase.
 */
function resolveAdvertisementLocation(ad: Advertisement): string {
  if (ad.location) return ad.location;
  const raw = ad as unknown as Record<string, unknown>;
  return typeof raw.Location === "string" ? raw.Location : ad.location;
}

function resolveAdvertisement(ad: Advertisement): Advertisement & { images: AdvertisementImage[] } {
  return { ...ad, location: resolveAdvertisementLocation(ad), images: resolveAdvertisementImages(ad.images) };
}

/** GET /api/advertisements — public. */
export async function getAdvertisements(): Promise<(Advertisement & { images: AdvertisementImage[] })[]> {
  const data = await apiFetch<unknown>("/api/advertisements", {
    next: { revalidate: 60, tags: ["advertisements"] },
  });
  return unwrapList<Advertisement>(data).map(resolveAdvertisement);
}

/** GET /api/advertisements/{id} — public. */
export async function getAdvertisementById(id: number): Promise<Advertisement & { images: AdvertisementImage[] }> {
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

/** POST /api/advertisements/{id}/images — multipart, single `file` field, SuperAdmin/SystemAdmin only. Adds one photo to an existing advertisement. */
export async function addAdvertisementImage(adId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await authFetch<unknown>(`/api/advertisements/${adId}/images`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
}

/** DELETE /api/advertisements/{id}/images/{imageId} — SuperAdmin/SystemAdmin only. */
export async function deleteAdvertisementImage(adId: number, imageId: number): Promise<void> {
  await authFetch<unknown>(`/api/advertisements/${adId}/images/${imageId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}

/** PUT /api/advertisements/{id}/images/reorder — SuperAdmin/SystemAdmin only. */
export async function reorderAdvertisementImages(adId: number, orderedImageIds: number[]): Promise<void> {
  await authFetch<unknown>(`/api/advertisements/${adId}/images/reorder`, {
    method: "PUT",
    body: { orderedImageIds },
    cache: "no-store",
  });
}
