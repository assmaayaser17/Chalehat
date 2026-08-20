import "server-only";

import { authFetch, resolveMediaUrl, unwrapList } from "@/lib/api/client";
import type { ChaletImage } from "@/lib/api/types";

function resolveImage(image: ChaletImage): ChaletImage {
  return { ...image, url: resolveMediaUrl(image.url) ?? image.url };
}

/**
 * GET /api/chalet/{id}/images/all — auth required. Returns every image
 * (approved or not) for management.
 *
 * Note the `/all` suffix: `/api/chalet/{id}/images` (no suffix) is also a
 * live route on this backend but always returns an empty list regardless of
 * what's actually stored — confirmed via live calls. It looks like a
 * separate, broken/legacy route, not an alias for this one. Don't
 * "simplify" this back to the shorter path without re-confirming that route
 * works first.
 */
export async function getChaletImages(chaletId: number): Promise<ChaletImage[]> {
  const data = await authFetch<unknown>(`/api/chalet/${chaletId}/images/all`, {
    cache: "no-store",
  });
  return unwrapList<ChaletImage>(data).map(resolveImage);
}

/** POST /api/chalet/{id}/images — multipart upload, auth required. New images start unapproved. */
export async function uploadChaletImage(chaletId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("File", file);
  await authFetch<unknown>(`/api/chalet/${chaletId}/images`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
}

/** PATCH /api/chalet/{id}/images/{imageId}/approve — auth required. */
export async function approveChaletImage(chaletId: number, imageId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/images/${imageId}/approve`, {
    method: "PATCH",
    cache: "no-store",
  });
}

/** PATCH /api/chalet/{id}/images/{imageId}/set-cover — auth required. */
export async function setCoverChaletImage(chaletId: number, imageId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/images/${imageId}/set-cover`, {
    method: "PATCH",
    cache: "no-store",
  });
}

/** DELETE /api/chalet/{id}/images/{imageId} — auth required. */
export async function deleteChaletImage(chaletId: number, imageId: number): Promise<void> {
  await authFetch<unknown>(`/api/chalet/${chaletId}/images/${imageId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
