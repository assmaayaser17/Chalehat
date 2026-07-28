import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatItem } from "@/components/shared/stat-item";
import { formatCurrency } from "@/lib/utils";
import type { Chalet } from "@/lib/api/types";

/** Pure presentation — stays a Server Component; used on the public listing and the ChaletAdmin dashboard. */
export function ChaletCard({ chalet, href }: { chalet: Chalet; href?: string }) {
  const link = href ?? `/chalets/${chalet.id}`;
  const image = chalet.coverImageUrl ?? chalet.images?.find((img) => img.isApproved)?.url;
  const isInactive = chalet.status && chalet.status !== "Active";

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={link} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-50">
          {image ? (
            <Image
              src={image}
              alt={chalet.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-300">
              <svg viewBox="0 0 48 48" className="h-14 w-14" aria-hidden="true">
                <path
                  d="M13 26 24 19l11 7v9a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1v-9Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {isInactive ? (
              <Badge variant="destructive" className="shadow-sm">
                Inactive
              </Badge>
            ) : (
              <span />
            )}
            {chalet.showPrice && (
              <Badge variant="accent" className="shadow-sm">
                {formatCurrency(chalet.basePrice)} / night
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="space-y-2.5 p-4">
        <Link href={link}>
          <h3
            dir="auto"
            className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary"
          >
            {chalet.name}
          </h3>
        </Link>
        <p dir="auto" className="line-clamp-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {chalet.address}
        </p>
        {chalet.description && (
          <p dir="auto" className="line-clamp-2 text-sm text-muted-foreground">
            {chalet.description}
          </p>
        )}
        <div className="grid grid-cols-3 divide-x divide-border rtl:divide-x-reverse border-t border-border pt-3">
          <StatItem icon={Users} value={chalet.maxGuests} label="Guests" />
          <StatItem icon={BedDouble} value={chalet.bedroomsCount} label="Rooms" className="ps-3" />
          <StatItem icon={Bath} value={chalet.bathroomsCount} label="Baths" className="ps-3" />
        </div>
      </CardContent>
    </Card>
  );
}
