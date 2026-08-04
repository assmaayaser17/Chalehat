import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { monthRange } from "@/lib/booking-calendar";
import type { ChaletCalendarDay } from "@/lib/api/types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ChaletCalendarView({
  year,
  month,
  basePath,
  days,
  failed,
}: {
  /** 0-indexed, JS Date convention. */
  month: number;
  year: number;
  basePath: string;
  days: ChaletCalendarDay[];
  failed: boolean;
}) {
  const { daysInMonth, firstWeekday } = monthRange(year, month);

  const byDate = new Map<string, ChaletCalendarDay>();
  for (const entry of days) {
    if (entry && typeof entry.date === "string") byDate.set(entry.date.slice(0, 10), entry);
  }

  const cells: Array<{ date: string; day: number } | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: `${year}-${pad(month + 1)}-${pad(day)}`, day });
  }

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const monthParam = (y: number, m: number) => `${y}-${pad(m + 1)}`;

  if (failed) {
    return (
      <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
        Couldn&apos;t load the calendar for this chalet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`${basePath}?month=${monthParam(prev.year, prev.month)}`}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`${basePath}?month=${monthParam(next.year, next.month)}`}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_SHORT.map((label) => (
          <div key={label} className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const entry = byDate.get(cell.date);
          const slots = entry?.slots ?? [];
          const booked = slots.length > 0;
          const title = booked
            ? slots.map((s) => s.customerName ?? (s.bookingId ? `Booking #${s.bookingId}` : "Booked")).join(", ")
            : "Available";
          return (
            <div
              key={cell.date}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border text-sm font-medium",
                booked
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-background text-foreground",
              )}
              title={title}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-destructive/30 bg-destructive/10" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-border bg-background" /> Available
        </span>
      </div>
    </div>
  );
}
