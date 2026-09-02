"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  approveChaletImage,
  deleteChaletImage,
  rejectChaletImage,
  setCoverChaletImage,
  uploadChaletImages,
} from "@/lib/api/chalet-images";
import { ApiError } from "@/lib/api/client";
import type { ActionResult } from "@/lib/auth/actions";

function revalidateChalet(chaletId: number) {
  revalidateTag("chalets");
  revalidateTag(`chalet-${chaletId}`);
  revalidatePath(`/dashboard/chalets/${chaletId}/images`);
  revalidatePath("/dashboard/chalets");
}

export async function uploadChaletImageAction(chaletId: number, formData: FormData): Promise<ActionResult> {
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { success: false, message: "Choose at least one image file." };
  }
  try {
    await uploadChaletImages(chaletId, files);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while uploading the image." };
  }
  revalidateChalet(chaletId);
  return { success: true };
}

export async function approveChaletImageAction(chaletId: number, imageId: number): Promise<ActionResult> {
  try {
    await approveChaletImage(chaletId, imageId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while approving the image." };
  }
  revalidateChalet(chaletId);
  return { success: true };
}

export async function rejectChaletImageAction(chaletId: number, imageId: number, reason: string): Promise<ActionResult> {
  if (!reason.trim()) {
    return { success: false, message: "A reason is required to reject a photo." };
  }
  try {
    await rejectChaletImage(chaletId, imageId, reason.trim());
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while rejecting the image." };
  }
  revalidateChalet(chaletId);
  return { success: true };
}

export async function setCoverChaletImageAction(chaletId: number, imageId: number): Promise<ActionResult> {
  try {
    await setCoverChaletImage(chaletId, imageId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while setting the cover image." };
  }
  revalidateChalet(chaletId);
  return { success: true };
}

export async function deleteChaletImageAction(chaletId: number, imageId: number): Promise<ActionResult> {
  try {
    await deleteChaletImage(chaletId, imageId);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while deleting the image." };
  }
  revalidateChalet(chaletId);
  return { success: true };
}
