import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChaletImagesManager } from "@/components/chalets/chalet-images-manager";
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Images — {chaletName}</h1>
        <p className="text-muted-foreground">Upload, approve, and pick the cover image for this chalet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
          <CardDescription>Only approved images are shown to visitors; the cover image appears on the listing card.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChaletImagesManager chaletId={chaletId} initialImages={images} />
        </CardContent>
      </Card>
    </div>
  );
}
