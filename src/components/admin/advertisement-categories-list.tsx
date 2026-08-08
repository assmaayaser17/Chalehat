"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tag, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { deleteAdvertisementCategoryAction } from "@/lib/actions/advertisement-category-actions";
import type { AdvertisementCategory } from "@/lib/api/types";

/**
 * Client Component: renders the server-fetched category list and handles
 * delete (server action + router.refresh to resync). No inline edit — the
 * API only documents create/delete for this resource, no update endpoint.
 */
export function AdvertisementCategoriesList({ initialCategories }: { initialCategories: AdvertisementCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = React.useState(initialCategories);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  async function handleDelete(category: AdvertisementCategory) {
    if (!window.confirm(`Delete "${category.name}"? This can't be undone.`)) return;
    setError(null);
    setPendingId(category.id);
    const result = await deleteAdvertisementCategoryAction(category.id);
    setPendingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead className="w-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length > 0 ? (
            categories.map((category) => {
              const isPending = pendingId === category.id;
              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <span dir="auto">{category.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-100 text-accent-700">
                      {category.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- icon URLs come from arbitrary admin-entered hosts
                        <img src={category.iconUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete category"
                        disabled={pendingId !== null}
                        onClick={() => handleDelete(category)}
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
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                No categories added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
