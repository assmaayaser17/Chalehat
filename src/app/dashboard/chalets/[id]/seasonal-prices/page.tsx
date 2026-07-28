import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ChaletSeasonalPricesManager } from "@/components/chalets/chalet-seasonal-prices-manager";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getAllSeasons } from "@/lib/api/season";
import { getChaletSeasonalPrices } from "@/lib/api/chalet-seasonal-prices";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Seasonal Prices" };

export default async function ChaletSeasonalPricesPage({ params }: PageProps) {
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

  let allSeasons: Awaited<ReturnType<typeof getAllSeasons>> = [];
  let linkedPrices: Awaited<ReturnType<typeof getChaletSeasonalPrices>> = [];
  let errorMessage: string | null = null;
  try {
    [allSeasons, linkedPrices] = await Promise.all([getAllSeasons(), getChaletSeasonalPrices(chaletId)]);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load seasonal prices.";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`Seasonal Prices — ${chalet.name}`}
        description="The price for a linked season automatically applies to any booking that falls within its dates."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Seasons</CardTitle>
          <CardDescription>Link a season to this chalet and set the price that applies during it.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {errorMessage ? (
            <Alert variant="destructive">{errorMessage}</Alert>
          ) : (
            <ChaletSeasonalPricesManager chaletId={chaletId} allSeasons={allSeasons} linkedPrices={linkedPrices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
