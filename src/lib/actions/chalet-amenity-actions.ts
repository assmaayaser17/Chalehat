"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { linkChaletAmenities, unlinkChaletAmenity } from "@/lib/api/chalet-amenities";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

function revalidateChaletAmenities(chaletId: number) {
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/amenities`);
  revalidatePath("/dashboard/chalets");
}

export async function linkChaletAmenitiesAction(chaletId: number, amenityIds: number[]): Promise<ActionResult> {
  if (amenityIds.length === 0) {
    return { success: false, message: "Choose at least one amenity to add." };
  }
  try {
    await linkChaletAmenities(chaletId, amenityIds);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding amenities." };
  }
  revalidateChaletAmenities(chaletId);
  return { success: true };
}

export async function unlinkChaletAmenityAction(chaletId: number, amenityId: number): Promise<ActionResult> {
  try {
    await unlinkChaletAmenity(chaletId, amenityId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while removing the amenity." };
  }
  revalidateChaletAmenities(chaletId);
  return { success: true };
}
