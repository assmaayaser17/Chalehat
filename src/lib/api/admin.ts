import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { ApiUser, CreateStaffRequest, UserRole } from "@/lib/api/types";

/** POST /api/Admin/create-staff — SuperAdmin/SystemAdmin only. */
export async function createStaff(data: CreateStaffRequest): Promise<ApiUser> {
  const result = await authFetch<unknown>("/api/Admin/create-staff", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ApiUser>(result);
}

/** GET /api/Admin/by-role/{role} — SuperAdmin/SystemAdmin only. The API doesn't
 *  echo `role` back on each user (it's implied by the URL), so we stamp it on. */
export async function getUsersByRole(role: UserRole): Promise<ApiUser[]> {
  const data = await authFetch<unknown>(`/api/Admin/by-role/${role}`, {
    cache: "no-store",
  });
  const users = unwrapList<Omit<ApiUser, "role">>(data);
  return users.map((user) => ({ ...user, role }));
}
