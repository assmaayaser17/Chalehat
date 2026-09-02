"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkle, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { unlinkChaletAmenityAction } from "@/lib/actions/chalet-amenity-actions";
import type { Amenity } from "@/lib/api/types";

/**
 * Client Component: the same amenities grid shown on the public chalet page,
 * with an optional "Remove" button per card. `canManage` gates that button —
 * customers get the plain read-only grid, the owning ChaletAdmin/SuperAdmin/
 * SystemAdmin also gets the button to unlink, mirroring the dedicated
 * `/dashboard/chalets/{id}/amenities` page's `ChaletAmenitiesManager`.
 */
export function ChaletAmenitiesDisplay({
  chaletId,
  amenities: initialAmenities,
  canManage,
}: {
  chaletId: number;
  amenities: Amenity[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [amenities, setAmenities] = React.useState(initialAmenities);
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAmenities(initialAmenities);
  }, [initialAmenities]);

  async function handleRemove(amenityId: number) {
    setError(null);
    setRemovingId(amenityId);
    try {
      const result = await unlinkChaletAmenityAction(chaletId, amenityId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setAmenities((prev) => prev.filter((a) => a.id !== amenityId));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  if (amenities.length === 0) return null;

  return (
    <div className="space-y-3">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((amenity) => (
          <div
            key={amenity.id}
            dir="auto"
            className="flex flex-col gap-2 rounded-xl border border-border bg-sand-50 p-3.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700">
                {amenity.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={amenity.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkle className="h-4 w-4" />
                )}
              </span>
              <span className="text-sm font-medium text-foreground">{amenity.name}</span>
            </div>
            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start text-destructive hover:text-destructive"
                disabled={removingId !== null}
                onClick={() => handleRemove(amenity.id)}
              >
                {removingId === amenity.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
