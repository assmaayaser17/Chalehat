"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { linkChaletAmenitiesAction } from "@/lib/actions/chalet-amenity-actions";
import type { Amenity } from "@/lib/api/types";

/**
 * Client Component: the API can only add amenities to a chalet (there's no
 * unlink endpoint), so linked amenities are shown as a fixed badge list and
 * the rest are selectable chips to add.
 */
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
              <Badge key={amenity.id} variant="success" dir="auto" className="gap-1">
                <Check className="h-3 w-3" /> {amenity.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">Add more amenities</h3>
        {available.length === 0 ? (
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
