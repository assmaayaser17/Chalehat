import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChaletWeekdayPriceForm } from "@/components/chalets/chalet-weekday-price-form";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Chalet Weekday Prices" };

export default async function ChaletWeekdayPricesPage({ params }: PageProps) {
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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`Weekday Prices — ${chalet.name}`}
        description="Set a price for specific days of the week, independent of any season. If a day also falls inside a linked season, whichever rule has the higher priority applies."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Add a weekday price</CardTitle>
          <CardDescription>
            The API doesn&apos;t yet expose a way to list or remove rules already added here — double check
            before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ChaletWeekdayPriceForm chaletId={chaletId} />
        </CardContent>
      </Card>
    </div>
  );
}
