"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Tag } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { createCustomerCategoryAction } from "@/lib/actions/customer-category-actions";
import type { CustomerCategory } from "@/lib/api/types";

/**
 * Client Component: create-and-list only — the API has no update/delete
 * endpoint for categories themselves (see the doc comment on
 * `CustomerCategory`), just create, list, and assign-to-a-customer.
 */
export function CustomerCategoriesManager({ initialCategories }: { initialCategories: CustomerCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = React.useState(initialCategories);
  const [name, setName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const result = await createCustomerCategoryAction({ name: name.trim() });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="w-64 space-y-1.5">
          <label htmlFor="categoryName" className="text-sm font-medium text-foreground">
            New category name
          </label>
          <Input
            id="categoryName"
            dir="auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP"
          />
        </div>
        <Button type="submit" loading={isSaving}>
          <PlusCircle /> Add category
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length > 0 ? (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell dir="auto" className="flex items-center gap-2 font-medium">
                  <Tag className="h-4 w-4 text-accent-600" />
                  {category.name}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-8 text-center text-muted-foreground">No customer categories added yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
