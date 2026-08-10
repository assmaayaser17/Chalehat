import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/client";
import { getAllUsers } from "@/lib/api/admin";
import { getCustomerBookingStats } from "@/lib/api/customer-reviews";
import type { CustomerBookingStats } from "@/lib/api/types";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export const metadata: Metadata = { title: "Customer Stats" };

/** First letters of up to the first two words of a full name, for the avatar fallback. */
function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function RatingCell({ value }: { value: number | undefined }) {
  if (!value || value <= 0) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="accent">{value}/5</Badge>;
}

export default async function CustomerStatsPage({ searchParams }: PageProps) {
  const { search } = await searchParams;

  let customers: Awaited<ReturnType<typeof getAllUsers>> = [];
  let statsByUserId = new Map<string, CustomerBookingStats>();
  let errorMessage: string | null = null;
  try {
    customers = await getAllUsers({ role: "Customer", search });
    // No bulk endpoint for this — one call per customer, run in parallel. A
    // customer with no reviews yet 404s/errors, which we just treat as "no
    // stats" rather than failing the whole page.
    const results = await Promise.all(
      customers.map(async (customer) => {
        try {
          return [customer.id, await getCustomerBookingStats(customer.id)] as const;
        } catch {
          return null;
        }
      }),
    );
    statsByUserId = new Map(results.filter((r): r is readonly [string, CustomerBookingStats] => r !== null));
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load customer stats.";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Customer Stats"
        description="Cleanliness, disturbance, and payment-reliability ratings for every customer, at a glance."
      />

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="w-64 space-y-1.5">
              <Label htmlFor="search">Search</Label>
              <Input id="search" name="search" defaultValue={search ?? ""} placeholder="Name, username, or email" />
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : customers.length === 0 ? (
        <EmptyState icon={Star} title="No customers match this search" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cleanliness</TableHead>
              <TableHead>Disturbance</TableHead>
              <TableHead>Payment reliability</TableHead>
              <TableHead>Admin notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const stats = statsByUserId.get(customer.id);
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary-100 text-primary-800">{initials(customer.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p dir="auto" className="font-semibold text-foreground">
                          {customer.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">@{customer.userName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                  <TableCell>
                    <RatingCell value={stats?.cleanlinessRating} />
                  </TableCell>
                  <TableCell>
                    <RatingCell value={stats?.disturbanceRating} />
                  </TableCell>
                  <TableCell>
                    <RatingCell value={stats?.paymentReliabilityRating} />
                  </TableCell>
                  <TableCell dir="auto" className="max-w-xs truncate text-sm text-muted-foreground">
                    {stats?.adminNotes ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
