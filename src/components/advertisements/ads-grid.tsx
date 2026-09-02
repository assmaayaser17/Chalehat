"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdCard } from "@/components/advertisements/ad-card";
import type { Advertisement, AdvertisementCategory, AdvertisementImage } from "@/lib/api/types";

type AdRow = Advertisement & { images: AdvertisementImage[] };

/** Client Component: renders the ads grid behind an "All + one per category" pill filter. */
export function AdsGrid({ ads, categories }: { ads: AdRow[]; categories: AdvertisementCategory[] }) {
  const [categoryId, setCategoryId] = React.useState<number | "all">("all");

  const filtered = categoryId === "all" ? ads : ads.filter((ad) => ad.categoryId === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryId("all")}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            categoryId === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            dir="auto"
            onClick={() => setCategoryId(category.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              categoryId === category.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 text-primary-200" />
          <p>No advertisements in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}
