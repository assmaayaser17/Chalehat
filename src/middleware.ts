import { NextResponse, type NextRequest } from "next/server";
import type { Session, UserRole } from "@/lib/api/types";
import { DASHBOARD_ROLES, STAFF_MANAGEMENT_ROLES } from "@/lib/api/types";
import { buildSession, isAccessTokenExpired } from "@/lib/auth/session";
import { refreshTokensDeduped } from "@/lib/api/client";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "chalehat_session";
// Mirrors setSession's floor in lib/auth/session.ts.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function readSession(request: NextRequest): Session | null {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function normalizeRole(role: string | undefined): UserRole | null {
  if (
    role === "SuperAdmin" ||
    role === "SystemAdmin" ||
    role === "ChaletAdmin" ||
    role === "Customer"
  ) {
    return role as UserRole;
  }
  return null;
}

function homeForRole(role: string | undefined) {
  const normalized = normalizeRole(role);
  if (normalized && STAFF_MANAGEMENT_ROLES.includes(normalized as (typeof STAFF_MANAGEMENT_ROLES)[number])) {
    return "/dashboard/staff";
  }
  if (normalized === "ChaletAdmin") return "/dashboard/chalets";
  if (normalized === "Customer") return "/";
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let session = readSession(request);

  // Proactively refresh an expired access token *here*, before the request
  // ever reaches a page. This is the fix for a real bug: Next.js only
  // allows `cookies().set()`/`.delete()` inside a Server Action or Route
  // Handler — never during a plain Server Component render. `authFetch`
  // (called directly from page data-fetching) was silently unable to
  // persist a rotated session cookie after refreshing, so the freshly
  // issued token worked for that one request but the *cookie* kept the
  // old, already-consumed refresh token. The next page load presented that
  // same dead token again, the backend's rotation reuse-detection rejected
  // it ("Security alert: this session has been invalidated"), and the
  // cycle repeated on every subsequent visit. Refreshing here means a page
  // never sees an expired token in the first place.
  let refreshedSession: Session | null = null;
  let sessionExpired = false;
  if (session && isAccessTokenExpired(session)) {
    try {
      const tokens = await refreshTokensDeduped(session.refreshToken);
      refreshedSession = buildSession(tokens);
      session = refreshedSession;
    } catch {
      session = null;
      sessionExpired = true;
    }
  }

  /** Applies whatever happened to the session above onto the response this request ends up returning. */
  function finish(response: NextResponse): NextResponse {
    if (refreshedSession) {
      response.cookies.set(COOKIE_NAME, JSON.stringify(refreshedSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    } else if (sessionExpired) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  }

  const isAuthPage = pathname === "/login";
  const isDashboard = pathname.startsWith("/dashboard");
  const isMyBookings = pathname.startsWith("/my-bookings");
  const isAccount = pathname.startsWith("/account");

  // Logged-in users shouldn't see the login screen again.
  if (isAuthPage && session) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Account settings (e.g. change password) — every role can reach this, no
  // role-specific scoping like /dashboard or /my-bookings.
  if (isAccount) {
    if (!session || normalizeRole(session.role) === null) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    return finish(NextResponse.next());
  }

  if (isMyBookings) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return finish(NextResponse.redirect(url));
    }
    if (normalizeRole(session.role) === null) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    // Only a Customer has bookings — every other role gets sent to their own home.
    if (session.role !== "Customer") {
      return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
    }
    return finish(NextResponse.next());
  }

  if (!isDashboard) {
    return finish(NextResponse.next());
  }

  // No session at all -> bounce to login, remembering where they were headed.
  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return finish(NextResponse.redirect(url));
  }

  // Corrupted/unknown role -> the session cookie can't be trusted, clear it and
  // send them back to login instead of falling back to a role that may not be
  // theirs (which previously caused an infinite redirect loop).
  if (normalizeRole(session.role) === null) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Customer (and any other non-admin role) has no dashboard area at all.
  if (!DASHBOARD_ROLES.includes(session.role as (typeof DASHBOARD_ROLES)[number])) {
    return finish(NextResponse.redirect(new URL("/", request.url)));
  }

  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(
    session.role as (typeof STAFF_MANAGEMENT_ROLES)[number],
  );
  const isChaletAdmin = session.role === "ChaletAdmin";
  // SuperAdmin can see every dashboard section; the other two roles are scoped.
  const isSuperAdmin = session.role === "SuperAdmin";

  if (pathname.startsWith("/dashboard/staff") && !isStaffAdmin && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  if (pathname.startsWith("/dashboard/chalets") && !isChaletAdmin && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Creating a chalet is a SuperAdmin-only action — a ChaletAdmin only ever
  // receives chalets that were created and assigned to them, they never
  // create their own (matches the business flow, not just an API permission).
  if (pathname.startsWith("/dashboard/chalets/new") && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  if (pathname.startsWith("/dashboard/amenities") && !isStaffAdmin && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Seasons are a shared, global concept — SuperAdmin only, unlike amenities
  // which SystemAdmin also manages.
  if (pathname.startsWith("/dashboard/seasons") && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Customer categories — no role restriction is documented for this
  // feature at all (unlike every other admin endpoint), but every example
  // request in the Postman collection uses a SuperAdmin token, so treated
  // as SuperAdmin-only here until confirmed otherwise.
  if (pathname.startsWith("/dashboard/customer-categories") && !isSuperAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Platform-wide statistics — SuperAdmin/SystemAdmin only per the API docs,
  // unlike per-chalet statistics which a ChaletAdmin also gets (that route
  // lives under /dashboard/chalets/[id]/statistics, already gated above).
  if (pathname.startsWith("/dashboard/statistics") && !isStaffAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Approving a chalet image is SuperAdmin/SystemAdmin only per the API's own
  // role rules — a ChaletAdmin uploads but never approves, even for their own
  // chalet, so this cross-chalet review queue is staff-only too.
  if (pathname.startsWith("/dashboard/pending-images") && !isStaffAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  // Managing advertisements/categories is SuperAdmin/SystemAdmin only per
  // the API's own role rules — no ChaletAdmin involvement at all.
  if (pathname.startsWith("/dashboard/advertisements") && !isStaffAdmin) {
    return finish(NextResponse.redirect(new URL(homeForRole(session.role), request.url)));
  }

  return finish(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-bookings/:path*", "/account/:path*", "/login"],
};
