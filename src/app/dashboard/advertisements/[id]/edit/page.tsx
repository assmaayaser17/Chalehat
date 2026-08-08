import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditAdvertisementForm } from "@/components/admin/edit-advertisement-form";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getAdvertisementById } from "@/lib/api/advertisements";
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
  const categories = await getAdvertisementCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Edit advertisement" description="Photos can't be changed here — only the listing details." />

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
