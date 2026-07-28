"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { registerAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function RegisterForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    const result = await registerAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input id="fullName" dir="auto" autoComplete="name" {...register("fullName")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="userName" label="Username" error={errors.userName?.message}>
          <Input id="userName" autoComplete="username" {...register("userName")} />
        </FormField>
        <FormField id="phoneNumber" label="Phone number" error={errors.phoneNumber?.message}>
          <Input id="phoneNumber" inputMode="tel" placeholder="0599000000" {...register("phoneNumber")} />
        </FormField>
      </div>

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register("confirmPassword")} />
        </FormField>
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
