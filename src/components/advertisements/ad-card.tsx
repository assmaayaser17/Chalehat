import Image from "next/image";
import Link from "next/link";
import { MapPin, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAdLocationDisplay } from "@/lib/utils";
import type { Advertisement, AdvertisementImage } from "@/lib/api/types";

/** Pure presentation — matches the visual language of `ChaletCard` so ads and chalets feel like one system. */
export function AdCard({ ad }: { ad: Advertisement & { images: AdvertisementImage[] } }) {
  const image = ad.images[0]?.url;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/ads/${ad.id}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-50">
          {image ? (
            <Image
              src={image}
              alt={ad.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-300">
              <Megaphone className="h-14 w-14" />
            </div>
          )}
        </div>
      </Link>
      <CardContent dir="auto" className="space-y-2 p-4">
        <Link href={`/ads/${ad.id}`}>
          <h3 className="line-clamp-1 font-semibold text-primary-800 transition-colors group-hover:text-primary-700">
            {ad.name}
          </h3>
        </Link>
        <p className="line-clamp-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {resolveAdLocationDisplay(ad)}
        </p>
      </CardContent>
    </Card>
  );
}
