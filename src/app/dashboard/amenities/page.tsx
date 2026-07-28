import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>All amenities</CardTitle>
          <CardDescription>{amenities.length} amenities currently added.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <AmenitiesList initialAmenities={amenities} />
        </CardContent>
      </Card>
    </div>
  );
}
