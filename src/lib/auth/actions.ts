"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginUser, registerUser, revokeToken } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { buildSession, clearSession, getSession, setSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";
import type { LoginFormValues, RegisterFormValues } from "@/lib/validations/auth";

export type ActionResult = { success: true } | { success: false; message: string };

function normalizeRole(role: string | undefined): UserRole {
  if (
    role === "SuperAdmin" ||
    role === "SystemAdmin" ||
    role === "ChaletAdmin" ||
    role === "Customer"
  ) {
    return role;
  }
  return "Customer";
}

/** Where a freshly-authenticated user should land, based on role. */
function homeForRole(role: string | undefined) {
  const normalized = normalizeRole(role);
  if (STAFF_MANAGEMENT_ROLES.includes(normalized as (typeof STAFF_MANAGEMENT_ROLES)[number])) {
    return "/dashboard/staff";
  }
  if (normalized === "ChaletAdmin") return "/dashboard/chalets";
  if (normalized === "Customer") return "/";
  return "/dashboard";
}

export async function loginAction(values: LoginFormValues): Promise<ActionResult> {
  let target: string;
  try {
    const tokens = await loginUser({ Identifier: values.identifier, password: values.password });
    const session = buildSession(tokens);
    await setSession(session);
    target = homeForRole(session.role);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    // Logged server-side (visible in your `npm run dev` terminal) — anything
    // that lands here is NOT a normal API error (bad credentials, etc.), it's
    // usually the login response shape not matching what the app expects.
    console.error("[loginAction] unexpected error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred while logging in."
          : `An unexpected error occurred while logging in (dev details: ${detail})`,
    };
  }
  redirect(target);
}

export async function registerAction(values: RegisterFormValues): Promise<ActionResult> {
  try {
    await registerUser({
      fullName: values.fullName,
      userName: values.userName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    console.error("[registerAction] unexpected error:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred while creating your account."
          : `An unexpected error occurred while creating your account (dev details: ${detail})`,
    };
  }
  redirect("/login?registered=1");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    // Best-effort — logout must succeed locally even if the backend call fails.
    await revokeToken(session.refreshToken).catch(() => undefined);
  }
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/login");
}
