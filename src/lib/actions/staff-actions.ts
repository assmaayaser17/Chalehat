"use server";

import { revalidatePath } from "next/cache";
import { createStaff } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { CreateStaffFormValues } from "@/lib/validations/staff";
import type { ActionResult } from "@/lib/auth/actions";

export async function createStaffAction(values: CreateStaffFormValues): Promise<ActionResult> {
  try {
    await createStaff({
      fullName: values.fullName,
      userName: values.userName,
      Email: values.email,
      password: values.password,
      role: values.role,
    });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while adding the staff member." };
  }
  revalidatePath("/dashboard/staff");
  return { success: true };
}
