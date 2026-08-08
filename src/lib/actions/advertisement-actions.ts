"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createAdvertisement, deleteAdvertisement, updateAdvertisement } from "@/lib/api/advertisements";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { AdvertisementFormValues } from "@/lib/validations/advertisement";
import type { ActionResult } from "@/lib/auth/actions";

function revalidateAdvertisements(id?: number) {
  revalidateTag("advertisements");
  if (id) revalidateTag(`advertisement-${id}`);
  revalidatePath("/dashboard/advertisements");
}

async function requireStaffAdmin(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };
  if (session.role !== "SuperAdmin" && session.role !== "SystemAdmin") {
    return { success: false, message: "You're not authorized to manage advertisements." };
  }
  return null;
}

/** `formData` is built by the caller with the exact field names the API expects — see `createAdvertisement`. */
export async function createAdvertisementAction(formData: FormData): Promise<ActionResult> {
  const unauthorized = await requireStaffAdmin();
  if (unauthorized) return unauthorized;

  try {
    await createAdvertisement(formData);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while creating the advertisement." };
  }
  revalidateAdvertisements();
  redirect("/dashboard/advertisements");
}

export async function updateAdvertisementAction(
  id: number,
  values: AdvertisementFormValues,
): Promise<ActionResult> {
  const unauthorized = await requireStaffAdmin();
  if (unauthorized) return unauthorized;

  try {
    await updateAdvertisement(id, values);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while updating the advertisement." };
  }
  revalidateAdvertisements(id);
  redirect("/dashboard/advertisements");
}

export async function deleteAdvertisementAction(id: number): Promise<ActionResult> {
  const unauthorized = await requireStaffAdmin();
  if (unauthorized) return unauthorized;

  try {
    await deleteAdvertisement(id);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while deleting the advertisement." };
  }
  revalidateAdvertisements(id);
  return { success: true };
}
