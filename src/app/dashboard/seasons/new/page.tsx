import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSeasonForm } from "@/components/admin/create-season-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Add Season" };

export default function NewSeasonPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        title="Add a new season"
        description={
          <>
            Once created, link this season to any chalet from that chalet&apos;s &quot;Seasonal Prices&quot; page.
          </>
        }
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Season details</CardTitle>
          <CardDescription>Dates can&apos;t overlap an existing season.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateSeasonForm />
        </CardContent>
      </Card>
    </div>
  );
}
