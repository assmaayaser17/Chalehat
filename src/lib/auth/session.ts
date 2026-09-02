import "server-only";

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import type { AccessTokenClaims, Session, UserRole } from "@/lib/api/types";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "chalehat_session";

function normalizeRole(role: unknown): UserRole {
  const candidate = Array.isArray(role) ? role[0] : role;
  if (
    candidate === "SuperAdmin" ||
    candidate === "SystemAdmin" ||
    candidate === "ChaletAdmin" ||
    candidate === "Customer"
  ) {
    return candidate as UserRole;
  }
  // Unknown/missing role claim — fail closed to the least-privileged role
  // instead of granting admin access by default.
  return "Customer";
}

/**
 * Decodes (without verifying — verification happens on the backend for every
 * request that carries the token) the access token's claims. The API uses the
 * classic long-form Microsoft/XML-SOAP claim URIs, which we normalize here.
 */
export function decodeAccessToken(accessToken: string): AccessTokenClaims {
  const raw = decodeJwt(accessToken) as Record<string, unknown>;

  const nameidentifier =
    (raw["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] as string) ??
    (raw.nameid as string) ??
    "";
  const name =
    (raw["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as string) ??
    (raw.unique_name as string) ??
    "";
  const emailaddress =
    (raw["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string) ??
    (raw.email as string) ??
    "";
  const role = normalizeRole(
    (raw["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as unknown) ??
      (raw.role as unknown),
  );

  return {
    nameidentifier,
    name,
    full_name: (raw.full_name as string) ?? name,
    emailaddress,
    role,
    exp: (raw.exp as number) ?? 0,
    iss: raw.iss as string | undefined,
    aud: raw.aud as string | undefined,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectCandidateObjects(value: unknown): Array<Record<string, unknown>> {
  const candidates: Array<Record<string, unknown>> = [];
  const seen = new WeakSet<object>();
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isPlainObject(current)) continue;
    if (seen.has(current)) continue;
    seen.add(current);
    candidates.push(current);

    for (const key of ["message", "data", "result", "response", "payload", "body", "token", "tokens"]) {
      const child = current[key];
      if (isPlainObject(child)) queue.push(child);
    }
  }

  return candidates;
}

function resolveTokenField(payload: unknown, keys: string[]): string | undefined {
  const candidates = collectCandidateObjects(payload);
  for (const candidate of candidates) {
    for (const key of keys) {
      const value = candidate[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

function getFieldNames(payload: unknown): string[] {
  const names = new Set<string>();
  if (isPlainObject(payload)) {
    Object.keys(payload).forEach((key) => names.add(key));
  }
  collectCandidateObjects(payload).forEach((candidate) => {
    Object.keys(candidate).forEach((key) => names.add(key));
  });
  return Array.from(names);
}

/**
 * Builds the cookie-ready Session object from a raw token response. The
 * Postman collection never documents the login response shape, so this
 * tolerates a few common alternate field names the .NET API might actually
 * use, instead of assuming `accessToken`/`refreshToken` blindly.
 */
export function buildSession(tokens: unknown, rememberMe?: boolean): Session {
  const accessToken = resolveTokenField(tokens, ["accessToken", "access_token", "token", "jwt"]);
  const refreshToken = resolveTokenField(tokens, ["refreshToken", "refresh_token", "refreshtoken", "refreshToken"]);

  if (!accessToken || typeof accessToken !== "string") {
    throw new Error(
      `No accessToken found in the login response. Fields received: ${getFieldNames(tokens).join(", ") || "none"}`,
    );
  }

  const claims = decodeAccessToken(accessToken);
  return {
    accessToken,
    refreshToken: refreshToken ?? "",
    userId: claims.nameidentifier,
    userName: claims.name,
    fullName: claims.full_name,
    email: claims.emailaddress,
    role: claims.role,
    rememberMe,
  };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * `rememberMe` (from the login form's checkbox) controls whether this
 * survives closing the browser at all — without it, this now sets a true
 * session cookie (no `maxAge`), matching what "Remember me" is supposed to
 * mean. Checked, it keeps the previous behavior: a long-lived cookie so the
 * refresh token (which usually outlives the access token) still has a
 * cookie to live in — `refresh()` rotates both on each use.
 */
export async function setSession(session: Session, rememberMe = false) {
  const store = await cookies();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  if (!rememberMe) {
    store.set(COOKIE_NAME, JSON.stringify(session), options);
    return;
  }

  const claims = decodeAccessToken(session.accessToken);
  const maxAge = Math.max(claims.exp - Math.floor(Date.now() / 1000), 60 * 5);
  store.set(COOKIE_NAME, JSON.stringify(session), {
    ...options,
    maxAge: Math.max(maxAge, 60 * 60 * 24 * 30),
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** True when the access token is expired or about to expire (30s skew). */
export function isAccessTokenExpired(session: Session): boolean {
  const claims = decodeAccessToken(session.accessToken);
  return claims.exp * 1000 < Date.now() + 30_000;
}
