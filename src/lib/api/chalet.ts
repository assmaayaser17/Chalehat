import "server-only";

import { apiFetch, authFetch, resolveMediaUrl, unwrapList, unwrapObject, unwrapPaginated } from "@/lib/api/client";
import type { Chalet, CreateChaletRequest, PaginatedResult } from "@/lib/api/types";

/** Resolves the relative media paths the API embeds on a chalet into absolute URLs. */
function resolveChaletMedia(chalet: Chalet): Chalet {
  return {
    ...chalet,
    coverImageUrl: resolveMediaUrl(chalet.coverImageUrl),
    images: chalet.images?.map((image) => ({ ...image, url: resolveMediaUrl(image.url) ?? image.url })),
  };
}

/**
 * GET /api/Chalet — public, cached and revalidated periodically. Throws on
 * failure — callers (`ChaletList`, `MyChaletsGrid`) already render a proper
 * error/empty state, so this must never mask a real failure with fake data.
 */
export async function getAllChalets(): Promise<Chalet[]> {
  const data = await apiFetch<unknown>('/api/Chalet', {
    next: { revalidate: 60, tags: ["chalets"] },
  });
  return unwrapList<Chalet>(data).map(resolveChaletMedia);
}

/**
 * GET /api/Chalet?page&pageSize — public. The endpoint is paginated
 * server-side (confirmed: `{ items, totalCount, page, pageSize, totalPages }`
 * nested under `message`) — used by the home page listing so the grid and
 * page-number controls reflect the real total instead of fetching everything.
 */
export async function getChaletsPage(page: number, pageSize: number): Promise<PaginatedResult<Chalet>> {
  const data = await apiFetch<unknown>(`/api/Chalet?page=${page}&pageSize=${pageSize}`, {
    next: { revalidate: 60, tags: ["chalets"] },
  });
  const result = unwrapPaginated<Chalet>(data);
  return { ...result, items: result.items.map(resolveChaletMedia) };
}

/** GET /api/Chalet/{id} — public. */
export async function getChaletById(id: number): Promise<Chalet> {
  const data = await apiFetch<unknown>(`/api/Chalet/${id}`, {
    next: { revalidate: 60, tags: ["chalets", `chalet-${id}`] },
  });
  return resolveChaletMedia(unwrapObject<Chalet>(data));
}

/** GET /api/Chalet/my-chalets — ChaletAdmin only. Throws on failure, see `getAllChalets`. */
export async function getMyChalets(): Promise<Chalet[]> {
  const data = await authFetch<unknown>('/api/Chalet/my-chalets', {
    cache: 'no-store',
  });
  return unwrapList<Chalet>(data).map(resolveChaletMedia);
}

/** POST /api/Chalet — ChaletAdmin only. */
export async function createChalet(data: CreateChaletRequest): Promise<Chalet> {
  const result = await authFetch<unknown>("/api/Chalet", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Chalet>(result);
}
