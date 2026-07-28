"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createBooking, previewBooking } from "@/lib/api/booking";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { BookingPreview, PreviewBookingRequest } from "@/lib/api/types";
import type { ActionResult } from "@/lib/auth/actions";

export type PreviewBookingResult = { success: true; preview: BookingPreview } | { success: false; message: string };

export async function previewBookingAction(input: PreviewBookingRequest): Promise<PreviewBookingResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Log in to preview a booking." };
  if (session.role !== "Customer") return { success: false, message: "Only customer accounts can book a chalet." };

  try {
    const preview = await previewBooking(input);
    return { success: true, preview };
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while previewing the price." };
  }
}

export async function createBookingAction(input: PreviewBookingRequest): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };
  if (session.role !== "Customer") return { success: false, message: "Only customer accounts can book a chalet." };

  try {
    await createBooking(input);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while creating the booking." };
  }

  revalidateTag("my-bookings");
  revalidatePath("/my-bookings");
  redirect("/my-bookings");
}
