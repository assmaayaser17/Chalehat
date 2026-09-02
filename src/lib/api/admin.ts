import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type {
  ApiUser,
  ChangeUserRoleRequest,
  CreateStaffRequest,
  CustomerCategory,
  GetAllUsersFilters,
  ToggleUserBlockRequest,
  UserRole,
} from "@/lib/api/types";

/**
 * `GET /api/admin/users` renders every field correctly (name, email,
 * isBlocked) except `role`, which comes back empty on the frontend — but the
 * `?role=` filter itself demonstrably works server-side, so the backend
 * clearly has the value, it just isn't landing on `role` the way every other
 * field lands on its own lowercase key. Two real possibilities for a .NET
 * Identity-backed API: the key is PascalCase (`Role`, matching the same
 * quirk `CreateStaffRequest.Email` needed), or ASP.NET Identity's own
 * multi-role model leaks through as a plural array (`roles: ["Customer"]`)
 * instead of a single string. This tries every shape rather than guessing
 * one — not confirmed live (no SuperAdmin credentials to inspect the raw
 * response with), so revisit this if the real shape turns out to be neither.
 */
function extractRole(raw: Record<string, unknown>): UserRole | undefined {
  const candidates: unknown[] = [raw.role, raw.Role, raw.roles, raw.Roles];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) return candidate as UserRole;
    if (Array.isArray(candidate) && typeof candidate[0] === "string") return candidate[0] as UserRole;
  }
  return undefined;
}

/**
 * Same story as `extractRole` — not confirmed live, tries every plausible
 * shape for a per-customer category list rather than assuming one. If none
 * of these match, `customerCategories` just stays `undefined` and the UI
 * falls back to not showing any badges (see `UsersTable`).
 */
function extractCategories(raw: Record<string, unknown>): CustomerCategory[] | undefined {
  const candidates: unknown[] = [raw.customerCategories, raw.CustomerCategories, raw.categories, raw.Categories];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate.map((entry, index): CustomerCategory => {
      if (typeof entry === "string") return { id: index, name: entry };
      const obj = entry as Record<string, unknown>;
      const id = obj.id ?? obj.Id ?? obj.categoryId ?? obj.CategoryId;
      const name = obj.name ?? obj.Name;
      return { id: typeof id === "number" ? id : index, name: typeof name === "string" ? name : String(entry) };
    });
  }
  return undefined;
}

function normalizeApiUser(raw: Record<string, unknown>): ApiUser {
  return {
    ...raw,
    phoneNumber: (raw.phoneNumber as string | undefined) ?? (raw.PhoneNumber as string | undefined),
    role: extractRole(raw) as UserRole,
    customerCategories: extractCategories(raw),
  } as ApiUser;
}

/** POST /api/Admin/create-staff — SuperAdmin/SystemAdmin only. */
export async function createStaff(data: CreateStaffRequest): Promise<ApiUser> {
  const result = await authFetch<unknown>("/api/Admin/create-staff", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<ApiUser>(result);

  
}

/**
 * GET /api/Admin/by-role/{role} — SuperAdmin, SystemAdmin, or ChaletAdmin per
 * the Postman collection (not SuperAdmin/SystemAdmin only, despite what this
 * comment used to say). The API doesn't echo `role` back on each user (it's
 * implied by the URL), so we stamp it on.
 */
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
  if (typeof filters.customerCategoryId === "number") params.set("customerCategoryId", String(filters.customerCategoryId));
  const query = params.toString();
  const data = await authFetch<unknown>(`/api/admin/users${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  return unwrapList<Record<string, unknown>>(data).map(normalizeApiUser);
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
