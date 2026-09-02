"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Client Component: a themed replacement for `window.prompt()` when
 * rejecting a photo — the native browser dialog looked jarring against the
 * dashboard's own styling. Built on the same Radix Dialog primitive `Sheet`
 * already uses elsewhere in this app.
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  subjectLabel,
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  /** e.g. the chalet's name, for a more specific title — falls back to a generic one if omitted. */
  subjectLabel?: string;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed start-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl",
            "border border-border bg-background p-5 shadow-lg outline-none data-[state=open]:animate-fade-in",
          )}
        >
          <DialogPrimitive.Title className="text-sm font-semibold text-foreground">
            Reject {subjectLabel ? <span dir="auto">photo from &quot;{subjectLabel}&quot;</span> : "this photo"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">
            This won&apos;t delete the photo — the owner will see it&apos;s rejected along with this reason.
          </DialogPrimitive.Description>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              dir="auto"
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photo is blurry, please upload a clearer one"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={isSubmitting}
              disabled={!reason.trim()}
              onClick={() => onConfirm(reason.trim())}
            >
              Reject
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
