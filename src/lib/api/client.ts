import "server-only";

import { buildSession, clearSession, getSession, isAccessTokenExpired, setSession } from "@/lib/auth/session";
import type { ApiErrorBody, AuthTokenResponse, PaginatedResult } from "@/lib/api/types";

const API_BASE_URL = process.env.API_BASE_URL || "https://chalehat.onrender.com";

/**
 * Resolves a media path returned by the API into an absolute, reachable URL.
 * The API is inconsistent: relative paths ("/uploads/...") on chalet reads,
 * absolute URLs pointing at its own unreachable dev host
 * ("https://localhost:7041/...") on some endpoints, and (for chalet images)
 * real absolute Cloudinary URLs that are already correct as-is. Only the
 * first two need rewriting — a genuine external absolute URL must be left
 * alone, or it gets corrupted into a nonexistent path on our own API host.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(path)) return path;
  const relative = path.replace(/^https?:\/\/[^/]+/i, "");
  return `${API_BASE_URL}${relative.startsWith("/") ? relative : `/${relative}`}`;
}

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  /** Passed straight through to fetch's `next` option for cache control. */
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
}

function extractMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as ApiErrorBody;
    if (typeof b.message === "string") return b.message;
    if (typeof b.title === "string") return b.title;
    if (typeof b.error === "string") return b.error;
    if (b.error && typeof b.error === "object" && typeof b.error.message === "string") {
      return b.error.message;
    }
    if (b.errors) {
      const first = Object.values(b.errors)[0];
      if (Array.isArray(first) && first.length > 0 && typeof first[0] === "string") return first[0];
    }
  }
  return `Request failed with status ${status}`;
}

/**
 * Low-level typed fetch against the Chalehat API. No auth handling —
 * used directly for the public endpoints and internally by `authFetch`.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, next, cache } = options;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = { Accept: "application/json" };
  // FormData: let fetch set Content-Type itself (it needs the multipart boundary).
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      next,
      cache,
      // The Render free-tier backend can cold-start slowly; bail out well
      // before a user (or the build's static-generation pass) would give up,
      // instead of hanging indefinitely on an unreachable host.
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your internet connection or try again later.");
  }

  const text = await res.text();
  const data = text ? safeJsonParse(text) : undefined;

  if (!res.ok) {
    // Logged server-side (visible in the `npm run dev` terminal, not the
    // browser) — the backend often returns an empty body on a 500, which
    // collapses to a generic "Request failed with status N" for the user.
    // This dumps exactly what the backend sent so a real failure can be
    // told apart from a body-shape mismatch.
    console.error(`[apiFetch] ${method} ${path} -> ${res.status}`, text || "(empty body)");
    throw new ApiError(res.status, extractMessage(res.status, data), data as ApiErrorBody);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The API wraps every response as `{ success, message: <payload> }` (occasionally
 * `data`/`result`/`items` instead of `message`). Some list endpoints (e.g. Chalet)
 * additionally paginate, nesting the array one level deeper as
 * `{ success, message: { items: [...], totalCount, page, pageSize, totalPages } }`.
 * These two helpers unwrap both shapes for list and single-object payloads
 * respectively, so each resource module doesn't have to re-implement this.
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (isRecord(data)) {
    for (const key of ["message", "items", "data", "result"]) {
      const value = data[key];
      if (Array.isArray(value)) return value as T[];
      if (isRecord(value) && Array.isArray(value.items)) return value.items as T[];
    }
  }
  return [];
}

/**
 * Unwraps a paginated list response, keeping `totalCount`/`page`/`pageSize`/
 * `totalPages` instead of discarding them like `unwrapList` does. Falls back
 * to treating a flat (non-paginated) array as a single full page, so callers
 * don't break if a given endpoint isn't actually paginated.
 */
export function unwrapPaginated<T>(data: unknown): PaginatedResult<T> {
  if (isRecord(data)) {
    for (const key of ["message", "data", "result"]) {
      const value = data[key];
      if (isRecord(value) && Array.isArray(value.items)) {
        const items = value.items as T[];
        return {
          items,
          totalCount: typeof value.totalCount === "number" ? value.totalCount : items.length,
          page: typeof value.page === "number" ? value.page : 1,
          pageSize: typeof value.pageSize === "number" ? value.pageSize : items.length,
          totalPages: typeof value.totalPages === "number" ? value.totalPages : 1,
        };
      }
    }
  }
  const items = unwrapList<T>(data);
  return { items, totalCount: items.length, page: 1, pageSize: items.length || 1, totalPages: 1 };
}

/** Unwraps a single-object response. Assumes the payload itself is the object once it has an `id` field. */
export function unwrapObject<T>(data: unknown): T {
  if (isRecord(data) && !("id" in data)) {
    for (const key of ["message", "data", "result"]) {
      if (isRecord(data[key])) return data[key] as unknown as T;
    }
  }
  return data as T;
}

/** Calls /Auth/refresh with the given refresh token. */
export async function refreshTokens(refreshToken: string): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/api/Auth/refresh", {
    method: "POST",
    body: { refreshToken },
    cache: "no-store",
  });
}

/**
 * Authenticated fetch for Server Components / Server Actions / Route Handlers.
 * Reads the session cookie, proactively refreshes an expired access token,
 * and retries once on a 401 in case the token was rejected server-side.
 */
export async function authFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = await getSession();
  if (!session) {
    throw new ApiError(401, "You must log in first.");
  }

  let accessToken = session.accessToken;

  if (isAccessTokenExpired(session)) {
    accessToken = await tryRefresh(session.refreshToken);
  }

  try {
    return await apiFetch<T>(path, { ...options, token: accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      accessToken = await tryRefresh(session.refreshToken);
      return apiFetch<T>(path, { ...options, token: accessToken });
    }
    throw err;
  }
}

/**
 * Deduplicates refresh attempts for the same refresh token, and — crucially
 * — keeps the *resolved* result around for a short grace window afterward.
 * The backend rotates refresh tokens on use (invalidating the old one). Two
 * gaps this closes:
 *
 * 1. Truly concurrent callers (e.g. a page's own `Promise.all`/
 *    `Promise.allSettled` of several authenticated reads, or a concurrent
 *    middleware invocation) that all see the same expired access token at
 *    once — without dedup they'd each independently POST /api/Auth/refresh
 *    with the same stale token.
 * 2. A request that arrives moments *after* an earlier refresh already
 *    completed, but whose own cookie read still has the pre-refresh value —
 *    the browser only applies a Set-Cookie once that response is processed,
 *    so a background request (e.g. Next.js `<Link>` prefetching another
 *    route) fired just before that can still carry the now-rotated token.
 *    Deleting the cache entry the instant the promise settles (as an
 *    in-flight-only dedup would) reopens this window; keeping it for a few
 *    seconds after resolution lets that straggler reuse the same result
 *    instead of re-presenting a dead token and tripping reuse-detection.
 *
 * Either way, the backend would otherwise treat the reused token as theft
 * and revoke the *entire* session — logging the user out with a "security
 * alert" even though nothing was actually wrong. Keyed by the refresh token
 * itself so unrelated sessions never share a slot; failed attempts are
 * evicted immediately instead of cached, so a genuinely dead session doesn't
 * get stuck retrying the same failure for the grace window.
 *
 * Deliberately touches no cookies — safe to call from anywhere (middleware,
 * Server Components/Actions, Route Handlers). `middleware.ts` calls this
 * directly and persists the result itself via `NextResponse` cookies (the
 * only context that reliably can — see `tryRefresh` below); everyone else
 * goes through `tryRefresh`.
 */
const refreshCache = new Map<string, Promise<AuthTokenResponse>>();
const REFRESH_CACHE_GRACE_MS = 10_000;

export async function refreshTokensDeduped(refreshToken: string): Promise<AuthTokenResponse> {
  let pending = refreshCache.get(refreshToken);
  if (!pending) {
    pending = refreshTokens(refreshToken);
    refreshCache.set(refreshToken, pending);
    pending.then(
      () => setTimeout(() => refreshCache.delete(refreshToken), REFRESH_CACHE_GRACE_MS),
      () => refreshCache.delete(refreshToken),
    );
  }
  return pending;
}

/**
 * Refreshes and persists the session cookie — only actually works when
 * called from a Server Action or Route Handler. Next.js forbids
 * `cookies().set()`/`.delete()` during a plain Server Component render, so
 * when `authFetch` is invoked from a page's own data-fetching (not an
 * action), this persistence step is unreachable in practice: `middleware.ts`
 * now refreshes proactively before the request ever reaches the page, so by
 * the time a Server Component runs, `getSession()` already returns a
 * current token and this function's proactive branch is never exercised —
 * it only remains as a fallback for the reactive (401-retry) path and for
 * calls genuinely made from Server Actions.
 */
async function tryRefresh(refreshToken: string): Promise<string> {
  try {
    // Note: does not evict `refreshCache` on failure here — the underlying
    // network call inside `refreshTokensDeduped` may have actually
    // succeeded, with the failure being `setSession`'s cookie write (e.g.
    // called from a context that can't persist it, see this function's doc
    // comment). Evicting a genuinely successful, still-reusable result
    // would reopen the exact reuse race this cache exists to close for any
    // other caller sharing it. `refreshTokensDeduped` already manages its
    // own cache lifecycle based on the real network outcome.
    const tokens = await refreshTokensDeduped(refreshToken);
    const session = buildSession(tokens);
    await setSession(session);
    return session.accessToken;
  } catch (err) {
    await clearSession();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }
}
