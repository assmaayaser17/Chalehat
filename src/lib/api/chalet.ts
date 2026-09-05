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

export interface ChaletListFilters {
  /** Matches against Name/Address. */
  search?: string;
  status?: "Active" | "UnderMaintenance" | "Inactive";
  /** Both filter on BasePrice. */
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * GET /api/Chalet?page&pageSize&search&status&minPrice&maxPrice&sortBy&sortDescending
 * — public. Confirmed via the live Swagger docs (`/swagger`). The endpoint is
 * paginated server-side (`{ items, totalCount, page, pageSize, totalPages }`
 * nested under `message`) — used by the home page listing and the dashboard's
 * "All Chalets" admin view so both reflect the real total instead of
 * fetching everything.
 */
export async function getChaletsPage(
  page: number,
  pageSize: number,
  filters: ChaletListFilters = {},
): Promise<PaginatedResult<Chalet>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (typeof filters.minPrice === "number") params.set("minPrice", String(filters.minPrice));
  if (typeof filters.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (typeof filters.sortDescending === "boolean") params.set("sortDescending", String(filters.sortDescending));

  const data = await apiFetch<unknown>(`/api/Chalet?${params.toString()}`, {
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
