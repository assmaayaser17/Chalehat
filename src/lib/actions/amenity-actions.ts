"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createAmenity, deleteAmenity, updateAmenity } from "@/lib/api/amenity";
import { ApiError } from "@/lib/api/client";
import type { AmenityFormValues } from "@/lib/validations/amenity";
import type { ActionResult } from "@/lib/auth/actions";

export async function createAmenityAction(values: AmenityFormValues): Promise<ActionResult> {
  try {
    await createAmenity({ name: values.name, iconUrl: values.iconUrl || null });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the amenity." };
  }
  revalidateTag("amenities");
  revalidatePath("/dashboard/amenities");
  redirect("/dashboard/amenities");
}

export async function updateAmenityAction(id: number, values: AmenityFormValues): Promise<ActionResult> {
  try {
    await updateAmenity(id, { name: values.name, iconUrl: values.iconUrl || null });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while updating the amenity." };
  }
  revalidateTag("amenities");
  revalidatePath("/dashboard/amenities");
  return { success: true };
}

export async function deleteAmenityAction(id: number): Promise<ActionResult> {
  try {
    await deleteAmenity(id);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while deleting the amenity." };
  }
  revalidateTag("amenities");
  revalidatePath("/dashboard/amenities");
  return { success: true };
}
