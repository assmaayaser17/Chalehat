import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAmenityForm } from "@/components/admin/create-amenity-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Add Amenity" };

export default function NewAmenityPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        title="Add a new amenity"
        description="The amenity will appear in the picker when creating or editing any chalet."
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Amenity details</CardTitle>
          <CardDescription>The icon link is optional.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <CreateAmenityForm />
        </CardContent>
      </Card>
    </div>
  );
}
