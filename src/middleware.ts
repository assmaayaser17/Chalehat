import { NextResponse, type NextRequest } from "next/server";
import type { Session, UserRole } from "@/lib/api/types";
import { DASHBOARD_ROLES, STAFF_MANAGEMENT_ROLES } from "@/lib/api/types";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "chalehat_session";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isDashboard = pathname.startsWith("/dashboard");
  const isMyBookings = pathname.startsWith("/my-bookings");

  // Logged-in users shouldn't see the login/register screens again.
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (isMyBookings) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
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
      return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (!isDashboard) {
    return NextResponse.next();
  }

  // No session at all -> bounce to login, remembering where they were headed.
  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
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
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(
    session.role as (typeof STAFF_MANAGEMENT_ROLES)[number],
  );
  const isChaletAdmin = session.role === "ChaletAdmin";
  // SuperAdmin can see every dashboard section; the other two roles are scoped.
  const isSuperAdmin = session.role === "SuperAdmin";

  if (pathname.startsWith("/dashboard/staff") && !isStaffAdmin && !isSuperAdmin) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (pathname.startsWith("/dashboard/chalets") && !isChaletAdmin && !isSuperAdmin) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  // Creating a chalet is a SuperAdmin-only action — a ChaletAdmin only ever
  // receives chalets that were created and assigned to them, they never
  // create their own (matches the business flow, not just an API permission).
  if (pathname.startsWith("/dashboard/chalets/new") && !isSuperAdmin) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  if (pathname.startsWith("/dashboard/amenities") && !isStaffAdmin && !isSuperAdmin) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  // Seasons are a shared, global concept — SuperAdmin only, unlike amenities
  // which SystemAdmin also manages.
  if (pathname.startsWith("/dashboard/seasons") && !isSuperAdmin) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-bookings/:path*", "/login", "/register"],
};
