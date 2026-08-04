"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markExpiredBookingsCompletedAction } from "@/lib/actions/chalet-booking-actions";

/** Client Component: bulk-transitions this chalet's past-due Confirmed bookings to Completed — nothing does this automatically. */
export function MarkExpiredCompletedButton({ chaletId }: { chaletId: number }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm("Mark every past-due confirmed booking for this chalet as completed?")) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await markExpiredBookingsCompletedAction(chaletId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" loading={isPending} onClick={handleClick}>
        <CalendarCheck /> Mark expired as completed
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
