import { NextResponse } from "next/server";
import { refreshTokens, ApiError } from "@/lib/api/client";
import { buildSession, clearSession, getSession, setSession } from "@/lib/auth/session";

/**
 * POST /api/auth/refresh
 *
 * Route Handler used by client-side code as a last resort when it gets a 401
 * from one of our internal API proxies (e.g. `/api/admin/users`) — rotates
 * the access/refresh token pair and rewrites the httpOnly session cookie.
 * Server Components/Actions never need this since `authFetch` already
 * refreshes proactively; this exists purely for the client-driven React
 * Query boundary.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "No active session." }, { status: 401 });
  }

  try {
    const tokens = await refreshTokens(session.refreshToken);
    const next = buildSession(tokens);
    await setSession(next);
    return NextResponse.json({ role: next.role, userName: next.userName });
  } catch (err) {
    await clearSession();
    const status = err instanceof ApiError ? err.status || 401 : 401;
    return NextResponse.json({ message: "Your session has expired." }, { status });
  }
}
