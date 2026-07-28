"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSeason } from "@/lib/api/season";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { SeasonFormValues } from "@/lib/validations/season";
import type { ActionResult } from "@/lib/auth/actions";

export async function createSeasonAction(values: SeasonFormValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };

  // Seasons are a shared, global concept used across every chalet — only a
  // SuperAdmin defines them. `middleware.ts` already blocks this route for
  // anyone else; this is defense in depth.
  if (session.role !== "SuperAdmin") {
    return { success: false, message: "You're not authorized to create seasons." };
  }

  try {
    await createSeason(values);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while creating the season." };
  }

  revalidateTag("seasons");
  revalidatePath("/dashboard/seasons");
  redirect("/dashboard/seasons");
}
