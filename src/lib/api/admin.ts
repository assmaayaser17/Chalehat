import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type {
  ApiUser,
  ChangeUserRoleRequest,
  CreateStaffRequest,
  GetAllUsersFilters,
  ToggleUserBlockRequest,
  UserRole,
} from "@/lib/api/types";

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

/**
 * GET /api/admin/users?role&isBlocked&search — SuperAdmin/SystemAdmin only.
 * Distinct from `getUsersByRole` above: a different backend endpoint that
 * returns every role (including Customer) with block status, and every
 * filter is optional. Confirmed via the API docs; response shape assumed to
 * match the standard `{ success, message: [...] }` envelope like every
 * other list endpoint.
 */
export async function getAllUsers(filters: GetAllUsersFilters = {}): Promise<ApiUser[]> {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (typeof filters.isBlocked === "boolean") params.set("isBlocked", String(filters.isBlocked));
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  const data = await authFetch<unknown>(`/api/admin/users${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  return unwrapList<ApiUser>(data);
}

/**
 * PATCH /api/admin/users/{id}/toggle-block — SuperAdmin/SystemAdmin only.
 * Flips the target user's blocked state; the same call both blocks and
 * unblocks depending on their current state. A SystemAdmin may only target
 * a Customer, per the API docs — enforced backend-side, and mirrored in
 * `toggleUserBlockAction` for a clean error before the request is sent.
 */
export async function toggleUserBlock(userId: string, data: ToggleUserBlockRequest): Promise<ApiUser> {
  const result = await authFetch<unknown>(`/api/admin/users/${userId}/toggle-block`, {
    method: "PATCH",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ApiUser>(result);
}

/** PATCH /api/admin/users/{id}/role — SuperAdmin only. */
export async function changeUserRole(userId: string, data: ChangeUserRoleRequest): Promise<ApiUser> {
  const result = await authFetch<unknown>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ApiUser>(result);
}
