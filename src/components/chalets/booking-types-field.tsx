"use client";

import { cn } from "@/lib/utils";
import { BOOKING_TYPES, type BookingType } from "@/lib/api/types";

const LABELS: Record<BookingType, string> = {
  Family: "Family",
  Youth: "Youth",
  Event: "Event",
};

/** Toggle-chip group that builds the `allowedBookingTypes` string array the API expects. */
export function BookingTypesField({
  value,
  onChange,
}: {
  value: BookingType[];
  onChange: (next: BookingType[]) => void;
}) {
  function toggle(type: BookingType) {
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BOOKING_TYPES.map((type) => {
        const active = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary-50 text-primary-800"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            {LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
