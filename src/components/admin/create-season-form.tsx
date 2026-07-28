"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seasonSchema, type SeasonFormValues } from "@/lib/validations/season";
import { createSeasonAction } from "@/lib/actions/season-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Client Component: react-hook-form. On success the server action itself
 * performs the redirect to `/dashboard/seasons`, so this only ever needs
 * to handle the failure path — including the API's overlap rejection
 * ("overlaps with an existing season").
 */
export function CreateSeasonForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { name: "", startDate: "", endDate: "", priority: 0 },
  });

  async function onSubmit(values: SeasonFormValues) {
    setServerError(null);
    const result = await createSeasonAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="name" label="Season name" error={errors.name?.message}>
        <Input id="name" placeholder="School holidays" {...register("name")} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="startDate" label="Start date" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...register("startDate")} />
        </FormField>
        <FormField id="endDate" label="End date" error={errors.endDate?.message}>
          <Input id="endDate" type="date" {...register("endDate")} />
        </FormField>
      </div>

      <FormField
        id="priority"
        label="Priority"
        error={errors.priority?.message}
        className="max-w-[10rem]"
      >
        <Input id="priority" type="number" {...register("priority")} />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Add season
      </Button>
    </form>
  );
}
