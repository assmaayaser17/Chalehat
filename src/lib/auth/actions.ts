"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { changePassword, forgotPassword, loginUser, registerUser, resetPassword, revokeToken, verifyOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { buildSession, clearSession, getSession, setSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES, type UserRole } from "@/lib/api/types";
import type {
  ChangePasswordFormValues,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
  VerifyOtpFormValues,
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
    const session = buildSession(tokens);
    await setSession(session);
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

export async function registerAction(values: RegisterFormValues): Promise<ActionResult> {
  let userId: string | undefined;
  try {
    const result = await registerUser({
      fullName: values.fullName,
      userName: values.userName,
      phoneNumber: values.phoneNumber,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    userId = result.userId;
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
  // The backend sends a verification SMS on register and rejects login until
  // it's confirmed — chain straight into the OTP step instead of sending the
  // user to a login page they can't actually use yet. If `userId` is ever
  // missing from the response, fall back to /login rather than dead-ending
  // on a page with nowhere to go.
  if (userId) redirect(`/verify-otp?userId=${encodeURIComponent(userId)}`);
  redirect("/login?registered=1");
}

export async function verifyOtpAction(values: VerifyOtpFormValues): Promise<ActionResult> {
  try {
    await verifyOtp(values);
  } catch (err) {
    if (err instanceof ApiError) return { success: false, message: err.message };
    console.error("[verifyOtpAction] unexpected error:", err);
    return { success: false, message: "An unexpected error occurred. Try again." };
  }
  redirect("/login?verified=1");
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
