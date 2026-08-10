"use server";

import { revalidatePath } from "next/cache";
import { changeUserRole, toggleUserBlock } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/api/types";

export async function toggleUserBlockAction(userId: string, targetRole: UserRole, reason: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };

  if (session.role !== "SuperAdmin" && session.role !== "SystemAdmin") {
    return { success: false, message: "You're not authorized to block or unblock users." };
  }
  // A SystemAdmin may only block/unblock Customers — SuperAdmin has no such
  // restriction, per the API docs.
  if (session.role === "SystemAdmin" && targetRole !== "Customer") {
    return { success: false, message: "As a System Admin, you can only block or unblock customers." };
  }
  if (!reason.trim()) {
    return { success: false, message: "Enter a reason." };
  }

  try {
    await toggleUserBlock(userId, { reason });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while updating this user." };
  }
  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function changeUserRoleAction(userId: string, newRole: UserRole): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };

  if (session.role !== "SuperAdmin") {
    return { success: false, message: "Only a Super Admin can change a user's role." };
  }

  try {
    await changeUserRole(userId, { newRole });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while changing this user's role." };
  }
  revalidatePath("/dashboard/users");
  return { success: true };
}
