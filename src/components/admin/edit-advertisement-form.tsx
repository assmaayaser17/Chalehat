"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { advertisementSchema, type AdvertisementFormValues } from "@/lib/validations/advertisement";
import { updateAdvertisementAction } from "@/lib/actions/advertisement-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Advertisement, AdvertisementCategory } from "@/lib/api/types";

/**
 * Client Component: update is a plain JSON PUT with no `images` field — the
 * API only accepts photos on create, so there's no re-upload UI here. On
 * success the action redirects to `/dashboard/advertisements`.
 */
export function EditAdvertisementForm({
  advertisement,
  categories,
}: {
  advertisement: Advertisement;
  categories: AdvertisementCategory[];
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdvertisementFormValues>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: {
      name: advertisement.name,
      description: advertisement.description,
      price: advertisement.price,
      categoryId: advertisement.categoryId,
      location: advertisement.location,
      phoneNumber: advertisement.phoneNumber,
    },
  });

  async function onSubmit(values: AdvertisementFormValues) {
    setServerError(null);
    const result = await updateAdvertisementAction(advertisement.id, values);
    if (!result.success) setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField id="name" label="Advertisement name" error={errors.name?.message}>
        <Input id="name" dir="auto" {...register("name")} />
      </FormField>

      <FormField id="description" label="Description" error={errors.description?.message}>
        <Textarea id="description" dir="auto" rows={4} {...register("description")} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="price" label="Price" error={errors.price?.message}>
          <Input id="price" type="number" step="any" {...register("price")} />
        </FormField>
        <FormField id="categoryId" label="Category" error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      <span dir="auto">{category.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField id="location" label="Location" error={errors.location?.message}>
        <Input id="location" dir="auto" {...register("location")} />
      </FormField>

      <FormField id="phoneNumber" label="Phone number" error={errors.phoneNumber?.message}>
        <Input id="phoneNumber" placeholder="+970591234567" {...register("phoneNumber")} />
      </FormField>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Save changes
      </Button>
    </form>
  );
}
