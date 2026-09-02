"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Check, ChevronLeft, ChevronRight, FolderOpen, ImageUp, Loader2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { cropImageToFile } from "@/lib/crop-image";
import { advertisementSchema, type AdvertisementFormValues } from "@/lib/validations/advertisement";
import {
  addAdvertisementImageAction,
  deleteAdvertisementImageAction,
  reorderAdvertisementImagesAction,
  updateAdvertisementAction,
} from "@/lib/actions/advertisement-actions";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import type { Advertisement, AdvertisementCategory, AdvertisementImage } from "@/lib/api/types";

/**
 * Client Component: the text-field form is a plain JSON PUT — `price` isn't
 * shown or edited here (these ads don't have a meaningful single price),
 * but the backend still requires the field on update, so whatever's already
 * on the record is sent back unseen. Images are managed separately below,
 * each add/remove/reorder its own immediate server action (the backend has
 * dedicated endpoints for those now, unlike at create time where images are
 * just local `File[]` state until the whole form submits).
 */
export function EditAdvertisementForm({
  advertisement,
  categories,
}: {
  advertisement: Advertisement & { images: AdvertisementImage[] };
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
      categoryId: advertisement.categoryId,
      // Falls back to `address` when `location` is blank (seen on records
      // edited directly through the API before) so the admin has something
      // to start from instead of an empty required field — see `resolveAdLocationDisplay`.
      location: advertisement.location || advertisement.address || "",
      address: advertisement.address ?? "",
      phoneNumber: advertisement.phoneNumber,
    },
  });

  async function onSubmit(values: AdvertisementFormValues) {
    setServerError(null);
    const result = await updateAdvertisementAction(advertisement.id, { ...values, price: advertisement.price });
    if (!result.success) setServerError(result.message);
  }

  return (
    <div className="space-y-8">
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

        <Button type="submit" size="lg" loading={isSubmitting}>
          Save changes
        </Button>
      </form>

      <div className="border-t border-border pt-6">
        <AdvertisementImagesEditor adId={advertisement.id} initialImages={advertisement.images ?? []} />
      </div>
    </div>
  );
}

/** Client Component: each add/remove/reorder is its own immediate server action + `router.refresh()`, independent of the text-field form above. */
function AdvertisementImagesEditor({ adId, initialImages }: { adId: number; initialImages: AdvertisementImage[] }) {
  const router = useRouter();
  const [images, setImages] = React.useState(initialImages);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  // Revoked on the way out so switching/cancelling the pending photo before
  // confirming doesn't leak object URLs.
  React.useEffect(() => {
    if (!pendingFile) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    return addAdvertisementImageAction(adId, formData);
  }

  /**
   * The add-image endpoint only takes one file per request. A single picked/
   * dropped photo gets a crop step first (matching the chalet-images crop
   * flow); several at once skip cropping and upload sequentially — there's
   * no sensible single crop rectangle across different photos.
   */
  async function addFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    if (imageFiles.length === 1) {
      setError(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setPendingFile(imageFiles[0] ?? null);
      return;
    }
    setError(null);
    setIsAdding(true);
    try {
      for (const file of imageFiles) {
        const result = await uploadFile(file);
        if (!result.success) {
          setError(result.message);
          return;
        }
      }
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  }

  function cancelPendingFile() {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirmPendingFile() {
    if (!pendingFile) return;
    setError(null);
    setIsAdding(true);
    try {
      const file =
        pendingPreviewUrl && croppedAreaPixels
          ? await cropImageToFile(pendingPreviewUrl, croppedAreaPixels, pendingFile.name, pendingFile.type)
          : pendingFile;
      const result = await uploadFile(file);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  }

  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    addFiles(files);
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

  async function handleDelete(imageId: number) {
    if (!window.confirm("Remove this image?")) return;
    setError(null);
    setPendingId(imageId);
    try {
      const result = await deleteAdvertisementImageAction(adId, imageId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    const current = images[index];
    const swapWith = images[target];
    if (target < 0 || target >= images.length || !current || !swapWith) return;
    const reordered = [...images];
    reordered[index] = swapWith;
    reordered[target] = current;
    const previous = images;
    setImages(reordered);
    setError(null);
    setPendingId(current.id);
    try {
      const result = await reorderAdvertisementImagesAction(
        adId,
        reordered.map((img) => img.id),
      );
      if (!result.success) {
        setError(result.message);
        setImages(previous);
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-primary-700">Photos</h2>
      {error && <Alert variant="destructive">{error}</Alert>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => {
            const isPending = pendingId === image.id;
            return (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- already-resolved arbitrary media URL */}
                <img
                  src={image.url}
                  alt=""
                  onClick={() => setLightboxUrl(image.url)}
                  className="h-full w-full cursor-zoom-in object-cover"
                />
                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Remove image"
                  disabled={pendingId !== null}
                  onClick={() => handleDelete(image.id)}
                  className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity group-hover:opacity-100 sm:opacity-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={pendingId !== null || index === 0}
                    onClick={() => handleMove(index, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={pendingId !== null || index === images.length - 1}
                    onClick={() => handleMove(index, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />

      {pendingFile && pendingPreviewUrl ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="relative mx-auto h-64 w-full max-w-sm overflow-hidden rounded-md border border-border bg-black/80">
            <Cropper
              image={pendingPreviewUrl}
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
            <p className="truncate text-sm font-medium text-foreground">{pendingFile.name}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isAdding} onClick={cancelPendingFile}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button type="button" size="sm" loading={isAdding} onClick={confirmPendingFile}>
                <Check className="h-4 w-4" /> Add photo
              </Button>
            </div>
          </div>
        </div>
      ) : (
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
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center transition-colors",
            isDragging ? "border-primary bg-primary-50" : "border-border bg-muted/20 hover:bg-muted/30",
          )}
        >
          <ImageUp className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Drag and drop photos here, or</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={isAdding}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FolderOpen className="h-4 w-4" /> Choose files
          </Button>
        </div>
      )}

      {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
