import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AmenitiesList } from "@/components/admin/amenities-list";
import { PageHeader } from "@/components/shared/page-header";
import { getAllAmenities } from "@/lib/api/amenity";

export const metadata: Metadata = { title: "Amenities" };

export default async function AmenitiesPage() {
  const amenities = await getAllAmenities();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Amenities"
        description="Amenities that can be linked to any chalet."
        actions={
          <Button asChild>
            <Link href="/dashboard/amenities/new">
              <PlusCircle /> Add amenity
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 bg-primary-800 px-5 py-4 text-white">
          <Sparkles className="h-4 w-4 text-accent-300" />
          <div>
            <p className="text-sm font-bold">All Amenities</p>
            <p className="text-xs text-primary-100">{amenities.length} amenities currently added.</p>
          </div>
        </div>
        <CardContent className="pt-5">
          <AmenitiesList initialAmenities={amenities} />
        </CardContent>
      </Card>
    </div>
  );
}
