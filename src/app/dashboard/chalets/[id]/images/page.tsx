import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChaletImagesManager } from "@/components/chalets/chalet-images-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getChaletImages } from "@/lib/api/chalet-images";
import { getSession } from "@/lib/auth/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Images" };

export default async function ChaletImagesPage({ params }: PageProps) {
  const { id } = await params;
  const chaletId = Number(id);
  if (!Number.isFinite(chaletId)) notFound();

  const session = await getSession();
  if (!session) redirect("/login");

  let chaletName: string;
  let isOwner: boolean;
  try {
    const chalet = await getChaletById(chaletId);
    chaletName = chalet.name;
    isOwner = chalet.ownerAdminId === session.userId;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const images = await getChaletImages(chaletId);

  // Mirrors the API's own per-endpoint role rules (confirmed against the
  // Postman docs): upload is the owning ChaletAdmin only, approve is
  // SuperAdmin/SystemAdmin only, delete is any of the three. The backend
  // still enforces this regardless — hiding the button here is just so the
  // UI doesn't offer an action that would 403.
  const canUpload = session.role === "ChaletAdmin" && isOwner;
  const canApprove = session.role === "SuperAdmin" || session.role === "SystemAdmin";
  const canDelete = canApprove || (session.role === "ChaletAdmin" && isOwner);

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
          <ChaletImagesManager
            chaletId={chaletId}
            initialImages={images}
            canUpload={canUpload}
            canApprove={canApprove}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
