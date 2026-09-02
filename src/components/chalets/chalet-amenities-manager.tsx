"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { linkChaletAmenitiesAction, unlinkChaletAmenityAction } from "@/lib/actions/chalet-amenity-actions";
import type { Amenity } from "@/lib/api/types";

/** Client Component: add amenities from the unlinked list, or remove a linked one — both server actions + `router.refresh()` to resync. */
export function ChaletAmenitiesManager({
  chaletId,
  allAmenities,
  linkedAmenities,
}: {
  chaletId: number;
  allAmenities: Amenity[];
  linkedAmenities: Amenity[];
}) {
  const router = useRouter();
  const linkedIds = new Set(linkedAmenities.map((a) => a.id));
  const available = allAmenities.filter((a) => !linkedIds.has(a.id));

  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const result = await linkChaletAmenitiesAction(chaletId, Array.from(selected));
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(amenityId: number) {
    setError(null);
    setRemovingId(amenityId);
    try {
      const result = await unlinkChaletAmenityAction(chaletId, amenityId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Already linked</h3>
        {linkedAmenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No amenities linked yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedAmenities.map((amenity) => (
              <Badge key={amenity.id} variant="success" dir="auto" className="gap-1 pe-1">
                <Check className="h-3 w-3" /> {amenity.name}
                <button
                  type="button"
                  aria-label={`Remove ${amenity.name}`}
                  disabled={removingId !== null}
                  onClick={() => handleRemove(amenity.id)}
                  className="ms-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                >
                  {removingId === amenity.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">Add more amenities</h3>
        {allAmenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No amenities exist yet — a SuperAdmin or SystemAdmin needs to create some before you can link any here.
          </p>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every amenity is already linked to this chalet.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {available.map((amenity) => {
                const active = selected.has(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    dir="auto"
                    onClick={() => toggle(amenity.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary-50 text-primary-800"
                        : "border-input text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {amenity.name}
                  </button>
                );
              })}
            </div>
            <Button type="button" loading={isSaving} disabled={selected.size === 0} onClick={handleSave}>
              <Plus /> Add selected amenities
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
