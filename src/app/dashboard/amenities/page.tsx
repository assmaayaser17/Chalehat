import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AmenitiesList } from "@/components/admin/amenities-list";
import { getAllAmenities } from "@/lib/api/amenity";

export const metadata: Metadata = { title: "Amenities" };

export default async function AmenitiesPage() {
  const amenities = await getAllAmenities();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Amenities</h1>
          <p className="text-muted-foreground">Amenities that can be linked to any chalet.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/amenities/new">
            <PlusCircle /> Add amenity
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All amenities</CardTitle>
          <CardDescription>{amenities.length} amenities currently added.</CardDescription>
        </CardHeader>
        <CardContent>
          <AmenitiesList initialAmenities={amenities} />
        </CardContent>
      </Card>
    </div>
  );
}
