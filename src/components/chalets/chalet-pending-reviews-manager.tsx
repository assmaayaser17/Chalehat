"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { approveChaletReviewAction } from "@/lib/actions/chalet-review-actions";
import { cn, formatDate } from "@/lib/utils";
import type { ChaletReview } from "@/lib/api/types";

/** Client Component: lists reviews awaiting moderation and lets the admin approve them one at a time. */
export function ChaletPendingReviewsManager({ chaletId, reviews }: { chaletId: number; reviews: ChaletReview[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleApprove(reviewId: number) {
    setError(null);
    setPendingId(reviewId);
    try {
      const result = await approveChaletReviewAction(reviewId, chaletId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (reviews.length === 0) {
    return <EmptyState icon={Star} title="No reviews waiting for approval" description="New customer reviews will show up here first." />;
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      {reviews.map((review) => {
        const isPending = pendingId === review.id;
        return (
          <div key={review.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span dir="auto" className="text-sm font-semibold text-foreground">
                  {review.userFullName || "Guest"}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < review.rating ? "fill-accent-500 text-accent-500" : "text-muted-foreground/25",
                      )}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p dir="auto" className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
              {review.createdAt && <p className="text-xs text-muted-foreground/70">{formatDate(review.createdAt)}</p>}
            </div>
            <Button type="button" size="sm" loading={isPending} onClick={() => handleApprove(review.id)}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          </div>
        );
      })}
    </div>
  );
}
