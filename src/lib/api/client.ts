import "server-only";

import { buildSession, clearSession, getSession, isAccessTokenExpired, setSession } from "@/lib/auth/session";
import type { ApiErrorBody, AuthTokenResponse } from "@/lib/api/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://chalehat.onrender.com";

/**
 * Resolves a media path returned by the API into an absolute, reachable URL.
 * The API is inconsistent: relative paths ("/uploads/...") on chalet reads,
 * but absolute URLs pointing at its own unreachable dev host
 * ("https://localhost:7041/...") from the images endpoints. Stripping any
 * origin and re-resolving against our real `API_BASE_URL` handles both.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
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
 * `data`/`result`/`items` instead of `message`). These two helpers unwrap that
 * envelope for list and single-object payloads respectively, so each resource
 * module doesn't have to re-implement the same unwrapping logic.
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (isRecord(data)) {
    for (const key of ["message", "items", "data", "result"]) {
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }
  return [];
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

async function tryRefresh(refreshToken: string): Promise<string> {
  try {
    const tokens = await refreshTokens(refreshToken);
    const session = buildSession(tokens);
    await setSession(session);
    return session.accessToken;
  } catch (err) {
    await clearSession();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }
}
