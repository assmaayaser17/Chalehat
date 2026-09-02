import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditAdvertisementForm } from "@/components/admin/edit-advertisement-form";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getAdvertisementById, getAdvertisements } from "@/lib/api/advertisements";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Advertisement" };

export default async function EditAdvertisementPage({ params }: PageProps) {
  const { id } = await params;
  const advertisementId = Number(id);
  if (!Number.isFinite(advertisementId)) notFound();

  let advertisement;
  try {
    advertisement = await getAdvertisementById(advertisementId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // `GET /api/advertisements/{id}` (used above) has been confirmed to come
  // back with a blank `location` for ads that show the correct location on
  // `GET /api/advertisements` (the list) — a genuine backend inconsistency
  // between the two endpoints, not a mapping bug on our side (both go
  // through the exact same `resolveAdvertisement`). Backfill from the list
  // when that happens, same pattern as the booking customer-name backfill.
  if (!advertisement.location) {
    try {
      const listed = await getAdvertisements();
      const match = listed.find((ad) => ad.id === advertisementId);
      if (match?.location) advertisement = { ...advertisement, location: match.location };
    } catch {
      // Non-critical — the edit form already falls back to `address` when location is still blank.
    }
  }

  const categories = await getAdvertisementCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Edit advertisement" description="Update the listing details, and add, remove, or reorder photos." />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Advertisement details</CardTitle>
          <CardDescription dir="auto">{advertisement.name}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <EditAdvertisementForm advertisement={advertisement} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
