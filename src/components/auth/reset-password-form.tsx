"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Client Component: `defaultPhoneNumber` prefills from the `?phone=` query
 * param set by `forgotPasswordAction`'s redirect, but stays editable in case
 * it was wrong. On success the server action redirects to /login.
 */
export function ResetPasswordForm({ defaultPhoneNumber }: { defaultPhoneNumber?: string }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { phoneNumber: defaultPhoneNumber ?? "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    const result = await resetPasswordAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="phoneNumber" label="Phone number" error={errors.phoneNumber?.message}>
        <Input id="phoneNumber" inputMode="tel" placeholder="+970599000000" {...register("phoneNumber")} />
      </FormField>

      <FormField id="code" label="Reset code" error={errors.code?.message}>
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" {...register("code")} />
      </FormField>

      <FormField id="newPassword" label="New password" error={errors.newPassword?.message}>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register("newPassword")} />
      </FormField>

      <FormField id="confirmNewPassword" label="Confirm new password" error={errors.confirmNewPassword?.message}>
        <PasswordInput id="confirmNewPassword" autoComplete="new-password" {...register("confirmNewPassword")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Reset password
      </Button>
    </form>
  );
}
