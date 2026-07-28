import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChaletImagesManager } from "@/components/chalets/chalet-images-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getChaletImages } from "@/lib/api/chalet-images";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Images" };

export default async function ChaletImagesPage({ params }: PageProps) {
  const { id } = await params;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

  let chaletName: string;
  try {
    chaletName = (await getChaletById(chaletId)).name;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const images = await getChaletImages(chaletId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`Images — ${chaletName}`}
        description="Upload, approve, and pick the cover image for this chalet."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Gallery</CardTitle>
          <CardDescription>
            Only approved images are shown to visitors; the cover image appears on the listing card.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ChaletImagesManager chaletId={chaletId} initialImages={images} />
        </CardContent>
      </Card>
    </div>
  );
}
