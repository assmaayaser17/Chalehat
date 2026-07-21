import "server-only";

import { apiFetch, authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { Amenity, CreateAmenityRequest } from "@/lib/api/types";

/** GET /api/Amenity — public. */
export async function getAllAmenities(): Promise<Amenity[]> {
  const data = await apiFetch<unknown>("/api/Amenity", {
    next: { revalidate: 60, tags: ["amenities"] },
  });
  return unwrapList<Amenity>(data);
}

/** POST /api/Amenity — SuperAdmin/SystemAdmin only. */
export async function createAmenity(data: CreateAmenityRequest): Promise<Amenity> {
  const result = await authFetch<unknown>("/api/Amenity", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Amenity>(result);
}

/** PUT /api/Amenity/{id} — SuperAdmin/SystemAdmin only. */
export async function updateAmenity(id: number, data: CreateAmenityRequest): Promise<Amenity> {
  const result = await authFetch<unknown>(`/api/Amenity/${id}`, {
    method: "PUT",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<Amenity>(result);
}

/** DELETE /api/Amenity/{id} — SuperAdmin/SystemAdmin only. */
export async function deleteAmenity(id: number): Promise<void> {
  await authFetch<unknown>(`/api/Amenity/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
