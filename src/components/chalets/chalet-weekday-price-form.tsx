"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { createChaletWeekdayPriceAction } from "@/lib/actions/chalet-weekday-price-actions";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

/**
 * Client Component: the API only exposes POST for weekday prices — no GET
 * or DELETE is documented, so a rule can't be listed or removed from this
 * app once added. This is create-only; the form just clears itself after a
 * successful submit rather than showing a "linked" list like seasons do.
 */
export function ChaletWeekdayPriceForm({ chaletId }: { chaletId: number }) {
  const [days, setDays] = React.useState<Set<number>>(new Set());
  const [price, setPrice] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function toggleDay(value: number) {
    setSuccess(false);
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      const result = await createChaletWeekdayPriceAction(
        chaletId,
        Array.from(days),
        Number(price),
        Number(priority) || 0,
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      setDays(new Set());
      setPrice("");
      setPriority("");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="success">Weekday price added.</Alert>}

      <div className="space-y-1.5">
        <Label>Days of the week</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const active = days.has(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary-50 text-primary-800"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <div className="w-32 space-y-1.5">
          <Label htmlFor="weekdayPrice">Price</Label>
          <Input id="weekdayPrice" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="w-32 space-y-1.5">
          <Label htmlFor="weekdayPriority">Priority</Label>
          <Input
            id="weekdayPriority"
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
        <Button type="button" loading={isSaving} disabled={days.size === 0 || !price} onClick={handleSave}>
          <Plus /> Add weekday price
        </Button>
      </div>
    </div>
  );
}
