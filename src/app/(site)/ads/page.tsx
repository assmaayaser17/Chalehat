import type { Metadata } from "next";
import { AdsGrid } from "@/components/advertisements/ads-grid";
import { getAdvertisements } from "@/lib/api/advertisements";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";

export const metadata: Metadata = { title: "Ads" };

export default async function AdsPage() {
  const [ads, categories] = await Promise.all([getAdvertisements(), getAdvertisementCategories()]);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold leading-tight text-primary-800 md:text-[40px]">Local Ads</h1>
        <p className="text-muted-foreground">Businesses and services near your chalet.</p>
      </div>

      <AdsGrid ads={ads} categories={categories} />
    </div>
  );
}
