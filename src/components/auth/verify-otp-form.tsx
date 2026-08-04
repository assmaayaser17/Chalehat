"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/lib/validations/auth";
import { verifyOtpAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** Client Component: `userId` comes from `registerAction`'s redirect, carried as a hidden field, not user-editable. */
export function VerifyOtpForm({ userId }: { userId: string }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { userId, code: "" },
  });

  async function onSubmit(values: VerifyOtpFormValues) {
    setServerError(null);
    const result = await verifyOtpAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <input type="hidden" {...register("userId")} />

      <FormField id="code" label="Verification code" error={errors.code?.message}>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          {...register("code")}
        />
      </FormField>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Verify
      </Button>
    </form>
  );
}
