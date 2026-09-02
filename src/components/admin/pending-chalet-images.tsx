"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { approveChaletImageAction, rejectChaletImageAction } from "@/lib/actions/chalet-image-actions";
import { RejectReasonDialog } from "@/components/shared/reject-reason-dialog";
import type { ChaletImage } from "@/lib/api/types";

export type PendingImage = ChaletImage & { chaletName: string };

/**
 * Client Component: a flat, cross-chalet moderation queue. There's no
 * aggregate "pending images" endpoint on the API — the page assembles this
 * list by calling `GET /api/chalet/{id}/images` once per chalet — so
 * approve/reject here still go through the same per-chalet
 * `approveChaletImageAction`/`rejectChaletImageAction` server actions the
 * per-chalet gallery uses, just without making the reviewer open each
 * chalet's own images page first. Rejecting requires a reason, doesn't
 * delete the photo, and the reason shows back to the chalet owner.
 */
export function PendingChaletImages({ images: initialImages }: { images: PendingImage[] }) {
  const router = useRouter();
  const [images, setImages] = React.useState(initialImages);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<PendingImage | null>(null);

  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  async function handleApprove(image: PendingImage) {
    setError(null);
    setPendingId(image.id);
    try {
      const result = await approveChaletImageAction(image.chaletId, image.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== image.id));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function submitReject(image: PendingImage, reason: string) {
    setError(null);
    setPendingId(image.id);
    try {
      const result = await rejectChaletImageAction(image.chaletId, image.id, reason);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== image.id));
      setRejecting(null);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          All caught up — nothing left to review.
        </p>
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
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <Link
                    href={`/dashboard/chalets/${image.chaletId}/images`}
                    className="line-clamp-1 px-1 text-xs font-medium text-primary-800 hover:underline"
                  >
                    {image.chaletName}
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    disabled={isPending}
                    onClick={() => handleApprove(image)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => setRejecting(image)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RejectReasonDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        isSubmitting={rejecting !== null && pendingId === rejecting.id}
        subjectLabel={rejecting?.chaletName}
        onConfirm={(reason) => rejecting && submitReject(rejecting, reason)}
      />
    </div>
  );
}
