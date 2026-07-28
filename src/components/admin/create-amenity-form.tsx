"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { amenitySchema, type AmenityFormValues } from "@/lib/validations/amenity";
import { createAmenityAction } from "@/lib/actions/amenity-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Client Component: react-hook-form. On success the server action itself
 * performs the redirect to `/dashboard/amenities`, so this only ever needs
 * to handle the failure path.
 */
export function CreateAmenityForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AmenityFormValues>({
    resolver: zodResolver(amenitySchema),
    defaultValues: { name: "", iconUrl: "" },
  });

  async function onSubmit(values: AmenityFormValues) {
    setServerError(null);
    const result = await createAmenityAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="name" label="Amenity name" error={errors.name?.message}>
        <Input id="name" dir="auto" placeholder="Pool, WiFi, ..." {...register("name")} />
      </FormField>

      <FormField id="iconUrl" label="Icon URL (optional)" error={errors.iconUrl?.message}>
        <Input id="iconUrl" placeholder="https://..." {...register("iconUrl")} />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Add amenity
      </Button>
    </form>
  );
}
