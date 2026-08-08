import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SeasonsTable } from "@/components/admin/seasons-table";
import { getAllSeasons } from "@/lib/api/season";

export const metadata: Metadata = { title: "Seasons" };

export default async function SeasonsPage() {
  const seasons = await getAllSeasons();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seasons"
        description="Shared time periods that can be linked to any chalet with its own price."
        actions={
          <Button asChild>
            <Link href="/dashboard/seasons/new">
              <PlusCircle /> Add season
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>All seasons</CardTitle>
          <CardDescription>{seasons.length} seasons currently defined.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {seasons.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No seasons added yet"
              description="Add the first season to start setting seasonal prices per chalet."
              action={
                <Button asChild size="sm">
                  <Link href="/dashboard/seasons/new">
                    <PlusCircle /> Add season
                  </Link>
                </Button>
              }
            />
          ) : (
            <SeasonsTable initialSeasons={seasons} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
