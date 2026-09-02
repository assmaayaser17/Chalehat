import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ChaletAmenitiesManager } from "@/components/chalets/chalet-amenities-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getAllAmenities } from "@/lib/api/amenity";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Amenities" };

export default async function ChaletAmenitiesPage({ params }: PageProps) {
  const { id } = await params;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

  let chalet;
  try {
    chalet = await getChaletById(chaletId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let allAmenities: Awaited<ReturnType<typeof getAllAmenities>> = [];
  let errorMessage: string | null = null;
  try {
    allAmenities = await getAllAmenities();
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load amenities.";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`Amenities — ${chalet.name}`}
        description="Add amenities to this chalet, or remove ones it no longer has."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Amenities</CardTitle>
          <CardDescription>Linked amenities appear on the chalet&apos;s public page.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <ChaletAmenitiesManager
              chaletId={chaletId}
              allAmenities={allAmenities}
              linkedAmenities={chalet.amenities ?? []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
