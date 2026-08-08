import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdvertisementCategoriesList } from "@/components/admin/advertisement-categories-list";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";

export const metadata: Metadata = { title: "Ad Categories" };

export default async function AdvertisementCategoriesPage() {
  const categories = await getAdvertisementCategories();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ad Categories"
        description="Categories that can be linked to any advertisement."
        actions={
          <Button asChild>
            <Link href="/dashboard/advertisements/categories/new">
              <PlusCircle /> Add category
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 bg-primary-800 px-5 py-4 text-white">
          <Tag className="h-4 w-4 text-accent-300" />
          <div>
            <p className="text-sm font-bold">All Categories</p>
            <p className="text-xs text-primary-100">{categories.length} categories currently added.</p>
          </div>
        </div>
        <CardContent className="pt-5">
          <AdvertisementCategoriesList initialCategories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
