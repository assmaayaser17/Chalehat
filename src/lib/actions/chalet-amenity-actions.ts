"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { linkChaletAmenities } from "@/lib/api/chalet-amenities";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

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
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/amenities`);
  revalidatePath("/dashboard/chalets");
  return { success: true };
}
