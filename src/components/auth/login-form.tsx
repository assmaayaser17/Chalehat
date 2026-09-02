"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { loginAction } from "@/lib/auth/actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Client Component: react-hook-form needs `useForm` (a hook), so this whole
 * form must run on the client. It calls the `loginAction` Server Action
 * directly from `onSubmit` — validation happens twice (here for instant UX,
 * again inside the action as defense in depth).
 */
export function LoginForm({ next }: { next?: string } = {}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { rememberMe: false } });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const result = await loginAction(values, next);
    // A successful login calls redirect() inside the action, which never
    // resolves back here — so reaching this line always means failure.
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="identifier" label="Username or email" error={errors.identifier?.message}>
        <Input id="identifier" autoComplete="username" {...register("identifier")} />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        labelAction={
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        }
      >
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
      </FormField>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <Switch id="rememberMe" checked={field.value ?? false} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
          Remember me
        </Label>
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Log in
      </Button>
    </form>
  );
}
