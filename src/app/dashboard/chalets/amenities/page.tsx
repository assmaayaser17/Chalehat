import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getAllAmenities } from "@/lib/api/amenity";

export const metadata: Metadata = { title: "Amenities" };

export default async function BrowseAmenitiesPage() {
  const amenities = await getAllAmenities();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Amenities"
        description={`All amenities available in the system. Link them to a chalet from that chalet's "Amenities" page.`}
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>All amenities</CardTitle>
          <CardDescription>{amenities.length} amenities available.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {amenities.length === 0 ? (
            <EmptyState icon={Sparkles} title="No amenities have been added yet" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2 rounded-md border border-border p-3 text-sm text-foreground transition-colors hover:border-primary-200 hover:bg-primary-50/50"
                >
                  {amenity.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={amenity.iconUrl} alt="" className="h-5 w-5 shrink-0" />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full bg-primary-100" />
                  )}
                  {amenity.name}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
