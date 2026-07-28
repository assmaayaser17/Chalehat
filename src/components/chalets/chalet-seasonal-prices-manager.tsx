"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Loader2, Plus, Sparkle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  deleteChaletSeasonalPriceAction,
  linkChaletSeasonalPriceAction,
} from "@/lib/actions/chalet-seasonal-price-actions";
import { formatCurrency } from "@/lib/utils";
import type { ChaletSeasonalPrice, Season } from "@/lib/api/types";

/**
 * Client Component: unlike amenities, the API supports unlinking a seasonal
 * price (DELETE /api/chalet/{id}/seasonal-prices/{priceId}), so linked
 * seasons are shown in an editable table rather than a fixed badge list.
 */
export function ChaletSeasonalPricesManager({
  chaletId,
  allSeasons,
  linkedPrices,
}: {
  chaletId: number;
  allSeasons: Season[];
  linkedPrices: ChaletSeasonalPrice[];
}) {
  const router = useRouter();
  const seasonById = new Map(allSeasons.map((s) => [s.id, s]));
  const linkedSeasonIds = new Set(linkedPrices.map((p) => p.seasonId));
  const available = allSeasons.filter((s) => !linkedSeasonIds.has(s.id));

  const [selectedSeasonId, setSelectedSeasonId] = React.useState<string>("");
  const [price, setPrice] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setIsSaving(true);
    try {
      const result = await linkChaletSeasonalPriceAction(chaletId, Number(selectedSeasonId), Number(price));
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSelectedSeasonId("");
      setPrice("");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(priceId: number) {
    if (!window.confirm("Remove this season's price from the chalet?")) return;
    setError(null);
    setPendingId(priceId);
    try {
      const result = await deleteChaletSeasonalPriceAction(chaletId, priceId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Linked seasons</h3>
        {linkedPrices.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No seasons linked yet"
            description="The base price applies year-round until you link one."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {linkedPrices.map((linked) => {
              const season = seasonById.get(linked.seasonId);
              const isPending = pendingId === linked.id;
              return (
                <div
                  key={linked.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-accent-200 bg-accent-100/50 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
                      <Sparkle className="h-3.5 w-3.5 fill-current" /> Seasonal price
                    </p>
                    <p dir="auto" className="truncate text-sm font-semibold text-foreground">
                      {season?.name ?? `Season #${linked.seasonId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {season ? `${season.startDate} – ${season.endDate}` : "—"}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-accent-700">{formatCurrency(linked.price)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove seasonal price"
                    disabled={pendingId !== null}
                    onClick={() => handleDelete(linked.id)}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Add a season</h3>
        {available.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            {allSeasons.length === 0
              ? "No seasons have been defined yet. Ask a Super Admin to add one."
              : "Every season is already linked to this chalet."}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="w-56 space-y-1.5">
              <Label htmlFor="seasonId">Season</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger id="seasonId">
                  <SelectValue placeholder="Choose a season" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((season) => (
                    <SelectItem key={season.id} value={String(season.id)}>
                      <span dir="auto">{season.name}</span> ({season.startDate} – {season.endDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <Button type="button" loading={isSaving} disabled={!selectedSeasonId || !price} onClick={handleAdd}>
              <Plus /> Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
