import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAdvertisementCategoryForm } from "@/components/admin/create-advertisement-category-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Add Ad Category" };

export default function NewAdvertisementCategoryPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        title="Add a new category"
        description="The category will appear in the picker when creating any advertisement."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Category details</CardTitle>
          <CardDescription>The icon link is optional.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateAdvertisementCategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
