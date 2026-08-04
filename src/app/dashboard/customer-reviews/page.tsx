import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getAllCustomerReviews } from "@/lib/api/customer-reviews";
import { formatDate } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ page?: string; minDisturbanceRating?: string }>;
}

export const metadata: Metadata = { title: "Customer Reviews" };

const PAGE_SIZE = 20;

export default async function CustomerReviewsPage({ searchParams }: PageProps) {
  const { page: pageParam, minDisturbanceRating: minDisturbanceParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const minDisturbanceRating = minDisturbanceParam ? Number(minDisturbanceParam) : undefined;

  let result: Awaited<ReturnType<typeof getAllCustomerReviews>> | null = null;
  let errorMessage: string | null = null;
  try {
    result = await getAllCustomerReviews(page, PAGE_SIZE, minDisturbanceRating);
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load customer reviews.";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Customer Reviews"
        description="Admin-authored reviews of customer behavior — cleanliness, disturbance, and payment reliability."
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="w-56 space-y-1.5">
              <Label htmlFor="minDisturbanceRating">Minimum disturbance rating</Label>
              <Input
                id="minDisturbanceRating"
                name="minDisturbanceRating"
                type="number"
                min={1}
                max={5}
                defaultValue={minDisturbanceParam ?? ""}
                placeholder="Any"
              />
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : !result || result.items.length === 0 ? (
        <EmptyState icon={Star} title="No customer reviews yet" description="Reviews left by chalet admins will show up here." />
      ) : (
        <>
          <div className="space-y-3">
            {result.items.map((review, i) => (
              <Card key={review.id ?? i}>
                <CardContent className="space-y-1.5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span dir="auto" className="text-sm font-semibold text-foreground">
                      {review.userFullName ?? (review.userId ? `Customer #${review.userId.slice(0, 8)}` : "Customer")}
                    </span>
                    {review.chaletName && (
                      <span dir="auto" className="text-xs text-muted-foreground">
                        {review.chaletName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    {typeof review.cleanlinessRating === "number" && <span>Cleanliness: {review.cleanlinessRating}/5</span>}
                    {typeof review.disturbanceRating === "number" && <span>Disturbance: {review.disturbanceRating}/5</span>}
                    {typeof review.paymentReliabilityRating === "number" && (
                      <span>Payment reliability: {review.paymentReliabilityRating}/5</span>
                    )}
                  </div>
                  {review.notes && (
                    <p dir="auto" className="text-sm text-muted-foreground">
                      {review.notes}
                    </p>
                  )}
                  {review.createdAt && <p className="text-xs text-muted-foreground/70">{formatDate(review.createdAt)}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {result.totalPages > 1 && (
            <nav className="flex justify-center gap-2">
              <Link
                href={`/dashboard/customer-reviews?page=${page - 1}${minDisturbanceParam ? `&minDisturbanceRating=${minDisturbanceParam}` : ""}`}
                aria-disabled={page <= 1}
                className={`flex h-9 w-9 items-center justify-center rounded-md border border-border ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="flex items-center px-2 text-sm text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>
              <Link
                href={`/dashboard/customer-reviews?page=${page + 1}${minDisturbanceParam ? `&minDisturbanceRating=${minDisturbanceParam}` : ""}`}
                aria-disabled={page >= result.totalPages}
                className={`flex h-9 w-9 items-center justify-center rounded-md border border-border ${page >= result.totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
