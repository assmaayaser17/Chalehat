"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createStaffSchema, type CreateStaffFormValues } from "@/lib/validations/staff";
import { createStaffAction } from "@/lib/actions/staff-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS_AR } from "@/lib/api/types";

/**
 * Client Component: react-hook-form + a controlled Select. On success it
 * invalidates the `admin-users` React Query cache so `UsersByRoleTable`
 * (a sibling under the same `QueryProvider`) picks up the new staff member
 * without a full page reload.
 */
export function CreateStaffForm() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { role: "ChaletAdmin" },
  });

  async function onSubmit(values: CreateStaffFormValues) {
    setServerError(null);
    setSuccess(false);
    const result = await createStaffAction(values);
    if (!result.success) {
      setServerError(result.message);
      return;
    }
    setSuccess(true);
    reset({ fullName: "", userName: "", email: "", password: "", phoneNumber: "", role: values.role });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {success && <Alert variant="success">Staff member added successfully.</Alert>}

      <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input id="fullName" dir="auto" {...register("fullName")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="userName" label="Username" error={errors.userName?.message}>
          <Input id="userName" {...register("userName")} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input id="password" type="password" {...register("password")} />
        </FormField>
        <FormField id="phoneNumber" label="Phone number" error={errors.phoneNumber?.message}>
          <Input id="phoneNumber" inputMode="tel" placeholder="+970599123456" {...register("phoneNumber")} />
        </FormField>
      </div>

      <FormField id="role" label="Role" error={errors.role?.message}>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SystemAdmin">{ROLE_LABELS_AR.SystemAdmin}</SelectItem>
                <SelectItem value="ChaletAdmin">{ROLE_LABELS_AR.ChaletAdmin}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Add staff member
      </Button>
    </form>
  );
}
