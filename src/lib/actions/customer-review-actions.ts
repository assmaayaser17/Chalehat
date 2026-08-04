"use server";

import { getCustomerBookingStats } from "@/lib/api/customer-reviews";
import { ApiError } from "@/lib/api/client";
import type { CustomerBookingStats } from "@/lib/api/types";

export type CustomerBookingStatsResult =
  | { success: true; stats: CustomerBookingStats }
  | { success: false; message: string };

export async function getCustomerBookingStatsAction(userId: string): Promise<CustomerBookingStatsResult> {
  try {
    const stats = await getCustomerBookingStats(userId);
    return { success: true, stats };
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "Couldn't load this customer's booking history." };
  }
}
