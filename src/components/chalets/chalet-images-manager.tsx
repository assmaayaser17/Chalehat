"use client";

import * as React from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useRouter } from "next/navigation";
import { Check, FolderOpen, ImageUp, Loader2, Star, Trash2, X, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { cropImageToFile } from "@/lib/crop-image";
import {
  approveChaletImageAction,
  deleteChaletImageAction,
  setCoverChaletImageAction,
  uploadChaletImageAction,
} from "@/lib/actions/chalet-image-actions";
import type { ChaletImage } from "@/lib/api/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ChaletImagesManagerProps {
  chaletId: number;
  initialImages: ChaletImage[];
  /** Owning ChaletAdmin only, per the API's own role rules — see the page's doc comment. */
  canUpload: boolean;
  /** SuperAdmin/SystemAdmin only. */
  canApprove: boolean;
  /** SuperAdmin, SystemAdmin, or the owning ChaletAdmin. */
  canDelete: boolean;
}

/** Client Component: upload form + gallery grid with approve/set-cover/delete, all via server actions + router.refresh to resync. */
export function ChaletImagesManager({
  chaletId,
  initialImages,
  canUpload,
  canApprove,
  canDelete,
}: ChaletImagesManagerProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = React.useState(initialImages);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  // Revoked on every change/unmount so we don't leak object URLs as the
  // admin swaps between a few photos before actually uploading one.
  const previewUrl = React.useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);
  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function pickFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile || !previewUrl) {
      setError("Choose an image file first.");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const fileToUpload = croppedAreaPixels
        ? await cropImageToFile(previewUrl, croppedAreaPixels, selectedFile.name, selectedFile.type)
        : selectedFile;
      const formData = new FormData();
      formData.set("file", fileToUpload);
      const result = await uploadChaletImageAction(chaletId, formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      clearSelectedFile();
      router.refresh();
    } catch {
      setError("Upload failed — the file may be too large or the connection was interrupted. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleApprove(imageId: number) {
    setError(null);
    setPendingId(imageId);
    try {
      const result = await approveChaletImageAction(chaletId, imageId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, isApproved: true } : img)));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleSetCover(imageId: number) {
    setError(null);
    setPendingId(imageId);
    try {
      const result = await setCoverChaletImageAction(chaletId, imageId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.map((img) => ({ ...img, isCoverImage: img.id === imageId })));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(imageId: number) {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    setError(null);
    setPendingId(imageId);
    try {
      const result = await deleteChaletImageAction(chaletId, imageId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      {canUpload && (
        <form onSubmit={handleUpload} className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {previewUrl && selectedFile ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="relative mx-auto h-72 w-full max-w-md overflow-hidden rounded-md border border-border bg-black/80">
                <Cropper
                  image={previewUrl}
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
                  <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <FolderOpen className="h-4 w-4" /> Change photo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearSelectedFile}>
                    <X className="h-4 w-4" /> Remove
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
                "flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary-50" : "border-border bg-muted/20 hover:bg-muted/30",
              )}
            >
              <ImageUp className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag and drop a photo here</p>
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
                <FolderOpen className="h-4 w-4" /> Choose file
              </Button>
            </div>
          )}

          {selectedFile && (
            <Button type="submit" loading={isUploading}>
              <ImageUp /> Upload image
            </Button>
          )}
        </form>
      )}

      {images.length === 0 ? (
        <EmptyState
          icon={ImageUp}
          title="No images uploaded yet"
          description={canUpload ? "Upload a photo to get started." : "The chalet owner hasn't uploaded any photos yet."}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const isPending = pendingId === image.id;
            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-primary-50">
                  <Image src={image.url} alt="" fill className="object-cover" sizes="200px" />
                  <div className="absolute start-2 top-2">
                    <Badge variant={image.isApproved ? "success" : "warning"} className="shadow-sm">
                      {image.isApproved ? "Approved" : "Pending review"}
                    </Badge>
                  </div>
                  {image.isCoverImage && (
                    <div
                      className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-600 text-white shadow-sm"
                      title="Cover image"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2">
                  {!image.isApproved && canApprove && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      disabled={isPending}
                      onClick={() => handleApprove(image.id)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </Button>
                  )}
                  {image.isApproved && !image.isCoverImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      disabled={isPending}
                      onClick={() => handleSetCover(image.id)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                      Set as cover
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-destructive hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(image.id)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
