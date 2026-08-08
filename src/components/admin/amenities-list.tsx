"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { deleteAmenityAction, updateAmenityAction } from "@/lib/actions/amenity-actions";
import type { Amenity } from "@/lib/api/types";

/** Client Component: renders the server-fetched list and handles edit/delete (server actions + router.refresh to resync). */
export function AmenitiesList({ initialAmenities }: { initialAmenities: Amenity[] }) {
  const router = useRouter();
  const [amenities, setAmenities] = React.useState(initialAmenities);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editIconUrl, setEditIconUrl] = React.useState("");
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAmenities(initialAmenities);
  }, [initialAmenities]);

  function startEdit(amenity: Amenity) {
    setError(null);
    setEditingId(amenity.id);
    setEditName(amenity.name);
    setEditIconUrl(amenity.iconUrl ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSave(id: number) {
    setError(null);
    setPendingId(id);
    const result = await updateAmenityAction(id, { name: editName, iconUrl: editIconUrl });
    setPendingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setAmenities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: editName, iconUrl: editIconUrl || null } : a)),
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this amenity?")) return;
    setError(null);
    setPendingId(id);
    const result = await deleteAmenityAction(id);
    setPendingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setAmenities((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amenity</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead className="w-24 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {amenities.length > 0 ? (
            amenities.map((amenity) => {
              const isEditing = editingId === amenity.id;
              const isPending = pendingId === amenity.id;
              return (
                <TableRow key={amenity.id}>
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input dir="auto" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <span dir="auto">{amenity.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {isEditing ? (
                      <Input
                        value={editIconUrl}
                        onChange={(e) => setEditIconUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-100 text-accent-700">
                        {amenity.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- icon URLs come from arbitrary admin-entered hosts, not our media backend
                          <img src={amenity.iconUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Save"
                            disabled={isPending}
                            onClick={() => handleSave(amenity.id)}
                          >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-success" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Cancel"
                            disabled={isPending}
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Edit amenity"
                            disabled={pendingId !== null}
                            onClick={() => startEdit(amenity)}
                          >
                            <Pencil className="h-4 w-4 text-primary-700" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete amenity"
                            disabled={pendingId !== null}
                            onClick={() => handleDelete(amenity.id)}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                No amenities added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
