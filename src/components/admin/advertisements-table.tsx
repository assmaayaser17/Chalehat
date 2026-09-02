"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { deleteAdvertisementAction } from "@/lib/actions/advertisement-actions";
import { resolveAdLocationDisplay } from "@/lib/utils";
import type { Advertisement, AdvertisementImage } from "@/lib/api/types";

type AdRow = Advertisement & { images: AdvertisementImage[]; categoryName?: string };

/** Client Component: renders the server-fetched advertisement list and handles delete (server action + router.refresh to resync). */
export function AdvertisementsTable({ initialAdvertisements }: { initialAdvertisements: AdRow[] }) {
  const router = useRouter();
  const [advertisements, setAdvertisements] = React.useState(initialAdvertisements);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAdvertisements(initialAdvertisements);
  }, [initialAdvertisements]);

  async function handleDelete(ad: AdRow) {
    if (!window.confirm(`Delete "${ad.name}"? This can't be undone.`)) return;
    setError(null);
    setPendingId(ad.id);
    const result = await deleteAdvertisementAction(ad.id);
    setPendingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setAdvertisements((prev) => prev.filter((a) => a.id !== ad.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Advertisement</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-24 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advertisements.length > 0 ? (
            advertisements.map((ad) => {
              const isPending = pendingId === ad.id;
              const image = ad.images[0]?.url;
              return (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent-100 text-accent-700">
                        {image ? (
                          <Image src={image} alt="" fill sizes="36px" className="object-cover" />
                        ) : (
                          <Megaphone className="h-4 w-4" />
                        )}
                      </span>
                      <span dir="auto">{ad.name}</span>
                    </div>
                  </TableCell>
                  <TableCell dir="auto" className="text-muted-foreground">
                    {ad.categoryName ?? `#${ad.categoryId}`}
                  </TableCell>
                  <TableCell dir="auto" className="text-muted-foreground">
                    {resolveAdLocationDisplay(ad)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label="Edit advertisement" asChild>
                        <Link href={`/dashboard/advertisements/${ad.id}/edit`}>
                          <Pencil className="h-4 w-4 text-primary-700" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete advertisement"
                        disabled={pendingId !== null}
                        onClick={() => handleDelete(ad)}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No advertisements added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
