import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Hands the current user's own access token back to their already-signed-in
 * browser, for the sole purpose of authenticating the SignalR notification
 * hub's WebSocket handshake (`accessTokenFactory`). The session itself lives
 * in an httpOnly cookie, unreadable from client JS by design — but SignalR's
 * browser client can't attach an `Authorization` header to a WebSocket
 * upgrade request either, so the token has to reach the client some way.
 * This route reads the same httpOnly cookie server-side (proving the caller
 * is already authenticated) and returns the token for that one purpose only —
 * never cached, never persisted client-side beyond the SignalR connection.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ accessToken: session.accessToken }, { headers: { "Cache-Control": "no-store" } });
}
