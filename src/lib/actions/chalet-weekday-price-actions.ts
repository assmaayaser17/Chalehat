"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createChaletWeekdayPrice, deleteChaletWeekdayPrice } from "@/lib/api/chalet-weekday-prices";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

export async function createChaletWeekdayPriceAction(
  chaletId: number,
  days: number[],
  morningPrice: number,
  eveningPrice: number,
  fullDayPrice: number,
  priority: number,
): Promise<ActionResult> {
  if (days.length === 0) {
    return { success: false, message: "Choose at least one day of the week." };
  }
  if ([morningPrice, eveningPrice, fullDayPrice].every((p) => !Number.isFinite(p) || p <= 0)) {
    return { success: false, message: "Enter at least one price greater than zero." };
  }
  try {
    await createChaletWeekdayPrice(chaletId, { days, morningPrice, eveningPrice, fullDayPrice, priority });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the weekday price." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/weekday-prices`);
  return { success: true };
}

export async function deleteChaletWeekdayPriceAction(chaletId: number, priceId: number): Promise<ActionResult> {
  try {
    await deleteChaletWeekdayPrice(chaletId, priceId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while removing the weekday price." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/weekday-prices`);
  return { success: true };
}
