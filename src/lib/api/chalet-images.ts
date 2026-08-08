import "server-only";

import { authFetch, resolveMediaUrl, unwrapList } from "@/lib/api/client";
import type { ChaletImage } from "@/lib/api/types";

function resolveImage(image: ChaletImage): ChaletImage {
  return { ...image, url: resolveMediaUrl(image.url) ?? image.url };
}

/** GET /api/chalet/{id}/images — auth required. Returns every image (approved or not) for management. */
export async function getChaletImages(chaletId: number): Promise<ChaletImage[]> {
  const data = await authFetch<unknown>(`/api/chalet/${chaletId}/images`, {
    cache: "no-store",
  });
  return unwrapList<ChaletImage>(data).map(resolveImage);
}

/**
 * POST /api/chalet/{id}/images — multipart upload, auth required. New images
 * start unapproved.
 *
 * Confirmed via a live call: the response echoes back a real-looking
 * `ChaletImage` (with an incrementing `id`), but the image never actually
 * shows up afterward on either this same list endpoint or on the chalet
 * detail endpoint's nested `images` — on any chalet, not just the one just
 * uploaded to. This is a backend persistence bug (looks like the write
 * isn't actually committed, or is committed somewhere the reads don't
 * look), not something fixable here. Don't spend more time debugging
 * "images not appearing" client-side without re-confirming this is fixed
 * server-side first.
 */
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
