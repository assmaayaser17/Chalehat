"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations/auth";
import { changePasswordAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** Client Component: unlike login/register/reset, success stays on this page — no page to redirect to, just an inline confirmation. */
export function ChangePasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    setServerError(null);
    setSuccess(false);
    const result = await changePasswordAction(values);
    if (!result.success) {
      setServerError(result.message);
      return;
    }
    reset();
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {success && <Alert variant="success">Your password was changed successfully.</Alert>}

      <FormField id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
        <PasswordInput id="currentPassword" autoComplete="current-password" {...register("currentPassword")} />
      </FormField>

      <FormField id="newPassword" label="New password" error={errors.newPassword?.message}>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register("newPassword")} />
      </FormField>

      <FormField id="confirmNewPassword" label="Confirm new password" error={errors.confirmNewPassword?.message}>
        <PasswordInput id="confirmNewPassword" autoComplete="new-password" {...register("confirmNewPassword")} />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
