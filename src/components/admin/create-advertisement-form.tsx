"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { advertisementSchema, type AdvertisementFormValues } from "@/lib/validations/advertisement";
import { createAdvertisementAction } from "@/lib/actions/advertisement-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdvertisementCategory } from "@/lib/api/types";

/**
 * Client Component: react-hook-form validates the text/number fields; the
 * image files live in separate state since RHF has no clean story for
 * `File[]`. On submit both are combined into one `FormData` with the exact
 * field names the API expects (`Name`, `description`, `price`, `categoryId`,
 * `location`, `phoneNumber`, one `images` entry per file) and handed to the
 * server action as-is. On success the action itself redirects to
 * `/dashboard/advertisements`, so this only ever needs to handle failure.
 */
export function CreateAdvertisementForm({ categories }: { categories: AdvertisementCategory[] }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Regenerated whenever the file list changes, and revoked on the way out
  // so picking/removing a few photos before submitting doesn't leak object URLs.
  React.useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdvertisementFormValues>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: { name: "", description: "", price: 0, location: "", phoneNumber: "" },
  });

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: AdvertisementFormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append("Name", values.name);
    formData.append("description", values.description);
    formData.append("price", String(values.price));
    formData.append("categoryId", String(values.categoryId));
    formData.append("location", values.location);
    formData.append("phoneNumber", values.phoneNumber);
    images.forEach((file) => formData.append("images", file));

    const result = await createAdvertisementAction(formData);
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

      <FormField id="images" label="Photos (optional)">
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChosen}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-800 file:transition-colors hover:file:bg-primary-100"
          />
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't handle it */}
                  <img src={imagePreviews[index]} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeImage(index)}
                    className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity group-hover:opacity-100 sm:opacity-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormField>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Publish advertisement
      </Button>
    </form>
  );
}
