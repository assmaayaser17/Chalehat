"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createAdvertisementCategory, deleteAdvertisementCategory } from "@/lib/api/advertisement-categories";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { AdvertisementCategoryFormValues } from "@/lib/validations/advertisement-category";
import type { ActionResult } from "@/lib/auth/actions";

function revalidateCategories() {
  revalidateTag("advertisement-categories");
  revalidatePath("/dashboard/advertisements/categories");
}

export async function createAdvertisementCategoryAction(
  values: AdvertisementCategoryFormValues,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };
  if (session.role !== "SuperAdmin" && session.role !== "SystemAdmin") {
    return { success: false, message: "You're not authorized to create advertisement categories." };
  }

  try {
    await createAdvertisementCategory({ name: values.name, iconUrl: values.iconUrl });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while creating the category." };
  }
  revalidateCategories();
  redirect("/dashboard/advertisements/categories");
}

export async function deleteAdvertisementCategoryAction(id: number): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };
  if (session.role !== "SuperAdmin" && session.role !== "SystemAdmin") {
    return { success: false, message: "You're not authorized to delete advertisement categories." };
  }

  try {
    await deleteAdvertisementCategory(id);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while deleting the category." };
  }
  revalidateCategories();
  return { success: true };
}
