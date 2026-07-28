"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { deleteChaletSeasonalPrice, linkChaletSeasonalPrice } from "@/lib/api/chalet-seasonal-prices";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

export async function linkChaletSeasonalPriceAction(
  chaletId: number,
  seasonId: number,
  price: number,
): Promise<ActionResult> {
  if (!seasonId) {
    return { success: false, message: "Choose a season to add." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, message: "Enter a price greater than zero." };
  }
  try {
    await linkChaletSeasonalPrice(chaletId, { seasonId, price });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the seasonal price." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/seasonal-prices`);
  return { success: true };
}

export async function deleteChaletSeasonalPriceAction(chaletId: number, priceId: number): Promise<ActionResult> {
  try {
    await deleteChaletSeasonalPrice(chaletId, priceId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while removing the seasonal price." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/seasonal-prices`);
  return { success: true };
}
