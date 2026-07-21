import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAmenityForm } from "@/components/admin/create-amenity-form";

export const metadata: Metadata = { title: "Add Amenity" };

export default function NewAmenityPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add a new amenity</h1>
        <p className="text-muted-foreground">The amenity will appear in the picker when creating or editing any chalet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amenity details</CardTitle>
          <CardDescription>The icon link is optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAmenityForm />
        </CardContent>
      </Card>
    </div>
  );
}
