"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatCurrency, WEEKDAY_LABELS } from "@/lib/utils";
import {
  createChaletWeekdayPriceAction,
  deleteChaletWeekdayPriceAction,
} from "@/lib/actions/chalet-weekday-price-actions";
import type { ChaletWeekdayPrice } from "@/lib/api/types";

/** Client Component: lists existing weekday-price rules and lets the admin add another. */
export function ChaletWeekdayPriceForm({
  chaletId,
  initialPrices,
}: {
  chaletId: number;
  initialPrices: ChaletWeekdayPrice[];
}) {
  const router = useRouter();
  const [days, setDays] = React.useState<Set<number>>(new Set());
  const [morningPrice, setMorningPrice] = React.useState("");
  const [eveningPrice, setEveningPrice] = React.useState("");
  const [fullDayPrice, setFullDayPrice] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete(priceId: number) {
    if (!window.confirm("Remove this weekday price?")) return;
    setError(null);
    setPendingId(priceId);
    try {
      const result = await deleteChaletWeekdayPriceAction(chaletId, priceId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  function toggleDay(value: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const result = await createChaletWeekdayPriceAction(
        chaletId,
        Array.from(days),
        Number(morningPrice) || 0,
        Number(eveningPrice) || 0,
        Number(fullDayPrice) || 0,
        Number(priority) || 0,
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      setDays(new Set());
      setMorningPrice("");
      setEveningPrice("");
      setFullDayPrice("");
      setPriority("");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Existing rules</h3>
        {initialPrices.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No weekday prices set yet"
            description="The base price applies on every day until you add one."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {initialPrices.map((rule) => {
              const isPending = pendingId === rule.id;
              return (
                <div
                  key={rule.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{rule.day}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>
                        Morning <strong className="font-semibold text-foreground">{formatCurrency(rule.morningPrice)}</strong>
                      </span>
                      <span>
                        Evening <strong className="font-semibold text-foreground">{formatCurrency(rule.eveningPrice)}</strong>
                      </span>
                      <span>
                        Full day <strong className="font-semibold text-foreground">{formatCurrency(rule.fullDayPrice)}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline">Priority {rule.priority}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove weekday price"
                      disabled={pendingId !== null}
                      onClick={() => handleDelete(rule.id)}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Add a weekday price</h3>
        <div className="space-y-1.5">
          <Label>Days of the week</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, value) => {
              const active = days.has(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary-50 text-primary-800"
                      : "border-input text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <div className="w-28 space-y-1.5">
            <Label htmlFor="weekdayMorningPrice">Morning</Label>
            <Input
              id="weekdayMorningPrice"
              type="number"
              min={0}
              value={morningPrice}
              onChange={(e) => setMorningPrice(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="weekdayEveningPrice">Evening</Label>
            <Input
              id="weekdayEveningPrice"
              type="number"
              min={0}
              value={eveningPrice}
              onChange={(e) => setEveningPrice(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="weekdayFullDayPrice">Full day</Label>
            <Input
              id="weekdayFullDayPrice"
              type="number"
              min={0}
              value={fullDayPrice}
              onChange={(e) => setFullDayPrice(e.target.value)}
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="weekdayPriority">Priority</Label>
            <Input
              id="weekdayPriority"
              type="number"
              min={0}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
          <Button
            type="button"
            loading={isSaving}
            disabled={days.size === 0 || (!morningPrice && !eveningPrice && !fullDayPrice)}
            onClick={handleSave}
          >
            <Plus /> Add weekday price
          </Button>
        </div>
      </div>
    </div>
  );
}
