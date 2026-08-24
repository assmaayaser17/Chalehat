"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assignCustomerCategories, createCustomerCategory } from "@/lib/api/customer-category";
import { ApiError } from "@/lib/api/client";
import type { CreateCustomerCategoryFormValues } from "@/lib/validations/customer-category";
import type { ActionResult } from "@/lib/auth/actions";

export async function createCustomerCategoryAction(values: CreateCustomerCategoryFormValues): Promise<ActionResult> {
  try {
    await createCustomerCategory({ name: values.name });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the category." };
  }
  revalidateTag("customer-categories");
  revalidatePath("/dashboard/customer-categories");
  return { success: true };
}

export async function assignCustomerCategoriesAction(customerId: string, categoryIds: number[]): Promise<ActionResult> {
  try {
    await assignCustomerCategories(customerId, { categoryIds });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while updating the customer's categories." };
  }
  revalidateTag("admin-users");
  revalidatePath("/dashboard/users");
  return { success: true };
}
