import { NextRequest, NextResponse } from "next/server";
import { getUsersByRole } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";
import { getSession } from "@/lib/auth/session";

/**
 * GET /api/admin/users?role=ChaletAdmin
 *
 * Thin authenticated proxy in front of `GET /api/Admin/by-role/{role}` on the
 * Chalehat backend. Exists so the staff dashboard's role filter can be a tiny
 * Client Component driven by React Query (instant refetch on role change)
 * without ever putting the bearer token in the browser — the access token
 * stays server-side in the httpOnly session cookie and this route reads it
 * for us via `getUsersByRole` -> `authFetch`.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !STAFF_MANAGEMENT_ROLES.includes(session.role as (typeof STAFF_MANAGEMENT_ROLES)[number])) {
    return NextResponse.json({ message: "You're not authorized to do this." }, { status: 403 });
  }

  const role = request.nextUrl.searchParams.get("role") as UserRole | null;
  if (!role) {
    return NextResponse.json({ message: "Role is required." }, { status: 400 });
  }

  try {
    const users = await getUsersByRole(role);
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status || 500 });
    }
    return NextResponse.json({ message: "Couldn't fetch users." }, { status: 500 });
  }
}
