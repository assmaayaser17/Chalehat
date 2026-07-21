"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createChalet } from "@/lib/api/chalet";
import { ApiError } from "@/lib/api/client";
import { getSession } from "@/lib/auth/session";
import type { CreateChaletFormValues } from "@/lib/validations/chalet";
import type { ActionResult } from "@/lib/auth/actions";

export async function createChaletAction(values: CreateChaletFormValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };

  // A ChaletAdmin always owns the chalet they create themselves. Anyone else
  // (SuperAdmin) must have picked an owner in the form — their own id isn't a
  // ChaletAdmin account, so the API would reject it.
  const ownerAdminId = session.role === "ChaletAdmin" ? session.userId : values.ownerAdminId;
  if (!ownerAdminId) {
    return { success: false, message: "Choose the chalet manager (ChaletAdmin) responsible for this chalet." };
  }

  let chalet;
  try {
    chalet = await createChalet({ ...values, ownerAdminId });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    return { success: false, message: "An unexpected error occurred while creating the chalet." };
  }

  revalidateTag("chalets");
  revalidatePath("/dashboard/chalets");
  // The API doesn't accept images at creation time (it needs the chalet's id
  // first), so send the admin straight into the upload step next.
  redirect(`/dashboard/chalets/${chalet.id}/images`);
}
