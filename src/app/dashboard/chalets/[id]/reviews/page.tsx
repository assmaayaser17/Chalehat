import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ChaletPendingReviewsManager } from "@/components/chalets/chalet-pending-reviews-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getPendingChaletReviews } from "@/lib/api/chalet-reviews";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Reviews" };

export default async function ChaletReviewsPage({ params }: PageProps) {
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

  let reviews: Awaited<ReturnType<typeof getPendingChaletReviews>> = [];
  let errorMessage: string | null = null;
  try {
    reviews = await getPendingChaletReviews(chaletId);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load pending reviews.";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`Reviews — ${chalet.name}`}
        description="Approve customer reviews before they show publicly on the chalet page."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Pending reviews</CardTitle>
          <CardDescription>
            {errorMessage ? "Couldn't load pending reviews." : `${reviews.length} review${reviews.length === 1 ? "" : "s"} waiting.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <ChaletPendingReviewsManager chaletId={chaletId} reviews={reviews} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
