import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAdvertisementForm } from "@/components/admin/create-advertisement-form";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";

export const metadata: Metadata = { title: "Add Advertisement" };

export default async function NewAdvertisementPage() {
  const categories = await getAdvertisementCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Add a new advertisement" description="Shown to customers on the public site once published." />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Advertisement details</CardTitle>
          <CardDescription>Photos are optional but recommended.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateAdvertisementForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
