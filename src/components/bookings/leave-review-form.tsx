"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { createChaletReviewAction } from "@/lib/actions/chalet-review-actions";
import { cn } from "@/lib/utils";

/** Client Component: a Completed booking's "Leave a review" button, expanding into a star-rating + comment form in place. */
export function LeaveReviewForm({ bookingId }: { bookingId: number }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return <p className="text-xs font-medium text-success">Thanks — your review was submitted for approval.</p>;
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Leave a review
      </Button>
    );
  }

  async function handleSubmit() {
    setError(null);
    if (rating < 1) {
      setError("Choose a rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createChaletReviewAction(bookingId, rating, comment);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-2.5 rounded-lg border border-border bg-muted/20 p-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const filled = value <= (hoverRating || rating);
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(value)}
            >
              <Star className={cn("h-5 w-5", filled ? "fill-accent-500 text-accent-500" : "text-muted-foreground/30")} />
            </button>
          );
        })}
      </div>
      <Textarea
        dir="auto"
        rows={2}
        placeholder="Tell us about your stay (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" loading={isSubmitting} onClick={handleSubmit}>
          Submit review
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={isSubmitting} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
