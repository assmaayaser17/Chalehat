import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, PlusCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdvertisementsTable } from "@/components/admin/advertisements-table";
import { PageHeader } from "@/components/shared/page-header";
import { getAdvertisements } from "@/lib/api/advertisements";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";

export const metadata: Metadata = { title: "Advertisements" };

export default async function AdvertisementsPage() {
  const [advertisements, categories] = await Promise.all([getAdvertisements(), getAdvertisementCategories()]);
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const rows = advertisements.map((ad) => ({ ...ad, categoryName: ad.categoryName ?? categoryNameById.get(ad.categoryId) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Advertisements"
        description="Local business ads shown to customers on the site."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/advertisements/categories">
                <Tag /> Categories
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/advertisements/new">
                <PlusCircle /> Add advertisement
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 bg-primary-800 px-5 py-4 text-white">
          <Megaphone className="h-4 w-4 text-accent-300" />
          <div>
            <p className="text-sm font-bold">All Advertisements</p>
            <p className="text-xs text-primary-100">{advertisements.length} advertisements currently added.</p>
          </div>
        </div>
        <CardContent className="pt-5">
          <AdvertisementsTable initialAdvertisements={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
