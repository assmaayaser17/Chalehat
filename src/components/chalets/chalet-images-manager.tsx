"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  approveChaletImageAction,
  deleteChaletImageAction,
  setCoverChaletImageAction,
  uploadChaletImageAction,
} from "@/lib/actions/chalet-image-actions";
import type { ChaletImage } from "@/lib/api/types";

/** Client Component: upload form + gallery grid with approve/set-cover/delete, all via server actions + router.refresh to resync. */
export function ChaletImagesManager({ chaletId, initialImages }: { chaletId: number; initialImages: ChaletImage[] }) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = React.useState(initialImages);
  const [isUploading, setIsUploading] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const result = await uploadChaletImageAction(chaletId, formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-800"
        />
        <Button type="submit" loading={isUploading}>
          <ImageUp /> Upload image
        </Button>
      </form>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No images uploaded yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const isPending = pendingId === image.id;
            return (
              <div key={image.id} className="overflow-hidden rounded-lg border border-border">
                <div className="relative aspect-square bg-primary-50">
                  <Image src={image.url} alt="" fill className="object-cover" sizes="200px" />
                  <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1">
                    <Badge variant={image.isApproved ? "success" : "outline"} className="shadow-sm">
                      {image.isApproved ? "Approved" : "Pending"}
                    </Badge>
                    {image.isCoverImage && (
                      <Badge variant="accent" className="shadow-sm">
                        Cover
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  {!image.isApproved && (
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
