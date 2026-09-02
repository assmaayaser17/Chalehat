"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { ChevronLeft, ChevronRight, FolderOpen, ImageUp, X, ZoomIn } from "lucide-react";
import { advertisementSchema, type AdvertisementFormValues } from "@/lib/validations/advertisement";
import { createAdvertisementAction } from "@/lib/actions/advertisement-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { cn } from "@/lib/utils";
import { cropImageToFile } from "@/lib/crop-image";
import type { AdvertisementCategory } from "@/lib/api/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client Component: react-hook-form validates the text fields; the image
 * files live in separate state since RHF has no clean story for `File[]`.
 * On submit both are combined into one `FormData` with the exact field
 * names the API expects (`Name`, `description`, `categoryId`, `location`,
 * `phoneNumber`, one `images` entry per file) and handed to the server
 * action as-is. `price` isn't collected here at all — these ads don't have
 * a meaningful single price — but the backend still takes the field, so a
 * fixed `0` is sent along without asking the admin about it. On success the
 * action itself redirects to `/dashboard/advertisements`, so this only ever
 * needs to handle failure.
 */
export function CreateAdvertisementForm({ categories }: { categories: AdvertisementCategory[] }) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Set right before opening the file input from "Change photo" so the next
  // pick replaces the single image instead of appending to it — the input
  // itself is shared with "Choose files" / "Add more", which do append.
  const replaceOnNextPickRef = React.useRef(false);

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
    defaultValues: { name: "", description: "", location: "", address: "", phoneNumber: "" },
  });

  function addFiles(files: File[], replace = false) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    const next = replace ? imageFiles : [...images, ...imageFiles];
    setImages(next);
    if (next.length === 1) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []), replaceOnNextPickRef.current);
    replaceOnNextPickRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    if (next.length === 1) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }

  function clearImages() {
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** The order images are appended to the upload `FormData` in is what the backend keeps as display order, so reordering here before submit is the only way to control it on create. */
  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      const current = prev[index];
      const swapWith = prev[target];
      if (target < 0 || target >= prev.length || !current || !swapWith) return prev;
      const next = [...prev];
      next[index] = swapWith;
      next[target] = current;
      return next;
    });
  }

  async function onSubmit(values: AdvertisementFormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append("Name", values.name);
    formData.append("description", values.description);
    formData.append("price", "0");
    formData.append("categoryId", String(values.categoryId));
    formData.append("location", values.location);
    if (values.address) formData.append("address", values.address);
    formData.append("phoneNumber", values.phoneNumber);

    const singleFile = images.length === 1 ? images[0] : undefined;
    const singlePreviewUrl = imagePreviews.length === 1 ? imagePreviews[0] : undefined;
    if (singleFile && singlePreviewUrl && croppedAreaPixels) {
      const cropped = await cropImageToFile(singlePreviewUrl, croppedAreaPixels, singleFile.name, singleFile.type);
      formData.append("images", cropped);
    } else {
      images.forEach((file) => formData.append("images", file));
    }

    try {
      const result = await createAdvertisementAction(formData);
      if (!result.success) setServerError(result.message);
    } catch {
      // A thrown value here isn't `redirect()` succeeding (that's handled by
      // Next's own router before control returns to us) — it's a genuine
      // transport failure, most likely the upload getting interrupted or
      // exceeding the server action body size limit for large photos.
      setServerError("Upload failed — the photos may be too large, or the connection was interrupted. Try again with fewer/smaller images.");
    }
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

      <FormField id="location" label="Location" error={errors.location?.message}>
        <Input id="location" dir="auto" {...register("location")} />
      </FormField>

      <FormField id="address" label="Address (optional)" error={errors.address?.message}>
        <Input id="address" dir="auto" {...register("address")} />
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
            className="hidden"
          />

          {images.length === 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary-50" : "border-border bg-muted/20 hover:bg-muted/30",
              )}
            >
              <ImageUp className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag and drop one or more photos here</p>
              <p className="text-xs text-muted-foreground/70">or</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FolderOpen className="h-4 w-4" /> Choose files
              </Button>
            </div>
          )}

          {images.length === 1 && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="relative mx-auto h-72 w-full max-w-md overflow-hidden rounded-md border border-border bg-black/80">
                <Cropper
                  image={imagePreviews[0]}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
              <div className="flex items-center gap-3 px-1">
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary-600"
                  aria-label="Zoom"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{images[0]?.name}</p>
                  <p className="text-xs text-muted-foreground">{images[0] && formatFileSize(images[0].size)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      replaceOnNextPickRef.current = true;
                      fileInputRef.current?.click();
                    }}
                  >
                    <FolderOpen className="h-4 w-4" /> Change photo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearImages}>
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't handle it */}
                  <img
                    src={imagePreviews[index]}
                    alt=""
                    onClick={() => imagePreviews[index] && setLightboxUrl(imagePreviews[index])}
                    className="h-full w-full cursor-zoom-in object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeImage(index)}
                    className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity group-hover:opacity-100 sm:opacity-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      disabled={index === 0}
                      onClick={() => moveImage(index, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors",
                  isDragging ? "border-primary bg-primary-50" : "border-border hover:bg-muted/30",
                )}
              >
                <FolderOpen className="h-5 w-5" />
                <span className="text-xs">Add more</span>
              </div>
            </div>
          )}
        </div>
      </FormField>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Publish advertisement
      </Button>

      {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </form>
  );
}
