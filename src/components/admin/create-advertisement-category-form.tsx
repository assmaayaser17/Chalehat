"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  advertisementCategorySchema,
  type AdvertisementCategoryFormValues,
} from "@/lib/validations/advertisement-category";
import { createAdvertisementCategoryAction } from "@/lib/actions/advertisement-category-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Client Component: react-hook-form. On success the server action itself
 * performs the redirect to `/dashboard/advertisements/categories`, so this
 * only ever needs to handle the failure path.
 */
export function CreateAdvertisementCategoryForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdvertisementCategoryFormValues>({
    resolver: zodResolver(advertisementCategorySchema),
    defaultValues: { name: "", iconUrl: "" },
  });

  async function onSubmit(values: AdvertisementCategoryFormValues) {
    setServerError(null);
    const result = await createAdvertisementCategoryAction(values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="name" label="Category name" error={errors.name?.message}>
        <Input id="name" dir="auto" placeholder="Restaurants, Transport, ..." {...register("name")} />
      </FormField>

      <FormField id="iconUrl" label="Icon URL (optional)" error={errors.iconUrl?.message}>
        <Input id="iconUrl" placeholder="https://..." {...register("iconUrl")} />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Add category
      </Button>
    </form>
  );
}
