import "server-only";

import { apiFetch, authFetch } from "@/lib/api/client";
import type { AuthTokenResponse, LoginRequest, RegisterRequest } from "@/lib/api/types";

/** POST /api/Auth/register — no auth required. The API responds with a
 *  success message; we don't assume tokens come back, so the flow always
 *  redirects to /login afterwards. */
export async function registerUser(data: RegisterRequest): Promise<unknown> {
  return apiFetch("/api/Auth/register", { method: "POST", body: data, cache: "no-store" });
}

/** POST /api/Auth/login — no auth required, returns the access/refresh token pair. */
export async function loginUser(data: LoginRequest): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>("/api/Auth/login", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
}

/** POST /api/Auth/revoke — invalidates a refresh token (logout). */
export async function revokeToken(refreshToken: string): Promise<void> {
  await apiFetch("/api/Auth/revoke", {
    method: "POST",
    body: { refreshToken },
    cache: "no-store",
  });
}

/** Any authenticated call can use this to double check who the current user is server-side. */
export async function pingProtected<T>(path: string): Promise<T> {
  return authFetch<T>(path, { cache: "no-store" });
}
