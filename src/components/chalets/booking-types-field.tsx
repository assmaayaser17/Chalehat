"use client";

import { cn } from "@/lib/utils";
import { BOOKING_TYPE_FLAGS } from "@/lib/api/types";

const OPTIONS: { flag: number; label: string }[] = [
  { flag: BOOKING_TYPE_FLAGS.Daily, label: "Daily" },
  { flag: BOOKING_TYPE_FLAGS.Weekend, label: "Weekend" },
  { flag: BOOKING_TYPE_FLAGS.Weekly, label: "Weekly" },
];

/** Toggle-chip group that packs the three booking types into the `allowedBookingTypes` bitmask the API expects. */
export function BookingTypesField({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = (value & opt.flag) !== 0;
        return (
          <button
            key={opt.flag}
            type="button"
            onClick={() => onChange(active ? value & ~opt.flag : value | opt.flag)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary-50 text-primary-800"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
