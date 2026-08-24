import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CustomerCategoriesManager } from "@/components/admin/customer-categories-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getAllCustomerCategories } from "@/lib/api/customer-category";

export const metadata: Metadata = { title: "Customer Categories" };

export default async function CustomerCategoriesPage() {
  let categories: Awaited<ReturnType<typeof getAllCustomerCategories>> = [];
  let errorMessage: string | null = null;
  try {
    categories = await getAllCustomerCategories();
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load customer categories.";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Customer Categories"
        description="Group customers into categories (e.g. VIP) that can be assigned from the Users page."
      />

      <Card>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <CustomerCategoriesManager initialCategories={categories} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
