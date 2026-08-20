import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Matches the backend's own validation exactly — confirmed live against
// POST /api/Auth/register, which 400s with this same message for anything
// else (including the local "0599..." format the Postman collection's own
// stale examples still use).
export const phoneNumberSchema = z
  .string()
  .regex(/^(\+970|\+972|00970|00972)5\d{8}$/, "Invalid phone number. Must start with +970, +972, 00970, or 00972");

const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a digit");

export const forgotPasswordSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    phoneNumber: phoneNumberSchema,
    code: z.string().min(4, "Enter the code sent to your phone"),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
