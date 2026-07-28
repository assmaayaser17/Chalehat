"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Client Component: on success the server action redirects straight to
 * /reset-password with the phone number carried over as a query param, so
 * this only ever needs to handle the failure path.
 */
export function ForgotPasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    const result = await forgotPasswordAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="phoneNumber" label="Phone number" error={errors.phoneNumber?.message}>
        <Input id="phoneNumber" inputMode="tel" placeholder="0599000000" {...register("phoneNumber")} />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Send reset code
      </Button>
    </form>
  );
}
