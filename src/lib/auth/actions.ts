"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { changePassword, forgotPassword, loginUser, resetPassword, revokeToken } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { buildSession, clearSession, getSession, setSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";
import type {
  ChangePasswordFormValues,
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
} from "@/lib/validations/auth";

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

export async function loginAction(values: LoginFormValues, next?: string): Promise<ActionResult> {
  let target: string;
  try {
    const tokens = await loginUser({ Identifier: values.identifier, password: values.password });
    const session = buildSession(tokens, values.rememberMe);
    await setSession(session, values.rememberMe);
    // Only honor a same-site relative path (never a full URL) to avoid an
    // open redirect via a crafted `next` query param.
    target = next && next.startsWith("/") && !next.startsWith("//") ? next : homeForRole(session.role);
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

export async function forgotPasswordAction(values: ForgotPasswordFormValues): Promise<ActionResult> {
  try {
    await forgotPassword({ phoneNumber: values.phoneNumber });
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    console.error("[forgotPasswordAction] unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Try again." };
  }
  redirect(`/reset-password?phone=${encodeURIComponent(values.phoneNumber)}`);
}

export async function resetPasswordAction(values: ResetPasswordFormValues): Promise<ActionResult> {
  try {
    await resetPassword(values);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    console.error("[resetPasswordAction] unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Try again." };
  }
  redirect("/login?resetPassword=1");
}

export async function changePasswordAction(values: ChangePasswordFormValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must log in first." };

  try {
    await changePassword(values);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    console.error("[changePasswordAction] unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Try again." };
  }
  // No redirect — this is a settings-style form the user stays on; the
  // caller shows an inline success message instead.
  return { success: true };
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
