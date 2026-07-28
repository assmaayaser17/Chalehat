"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createChaletWeekdayPrice } from "@/lib/api/chalet-weekday-prices";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

export async function createChaletWeekdayPriceAction(
  chaletId: number,
  days: number[],
  price: number,
  priority: number,
): Promise<ActionResult> {
  if (days.length === 0) {
    return { success: false, message: "Choose at least one day of the week." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, message: "Enter a price greater than zero." };
  }
  try {
    await createChaletWeekdayPrice(chaletId, { days, price, priority });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the weekday price." };
  }
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/weekday-prices`);
  return { success: true };
}
