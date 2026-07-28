import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Bath,
  CalendarClock,
  MapPin,
  MessageCircle,
  Moon,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getSession } from "@/lib/auth/session";
import { BOOKING_TYPE_LABELS, formatCurrency, getActiveBookingTypes } from "@/lib/utils";
import { ChaletBookingWidget } from "@/components/chalets/chalet-booking-widget";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadChalet(idParam: string) {
  const id = Number(idParam);
  if (!Number.isFinite(id)) return null;
  try {
    return await getChaletById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const chalet = await loadChalet(id);
  if (!chalet) return { title: "Chalet not found" };
  return {
    title: chalet.name,
    description: chalet.description?.slice(0, 150),
  };
}

export default async function ChaletDetailPage({ params }: PageProps) {
  const { id } = await params;
  const chalet = await loadChalet(id);
  if (!chalet) notFound();
  const session = await getSession();

  const approvedImages = chalet.images?.filter((img) => img.isApproved) ?? [];
  const image = chalet.coverImageUrl ?? approvedImages[0]?.url;
  const galleryImages = approvedImages.filter((img) => img.url !== image);
  const activeBookingTypes = getActiveBookingTypes(chalet.allowedBookingTypes);
  const whatsappHref = `https://wa.me/${chalet.whatsAppNumber.replace(/^0/, "970")}`;

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-primary-50">
            {image ? (
              <Image src={image} alt={chalet.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary-300">
                <svg viewBox="0 0 48 48" className="h-20 w-20" aria-hidden="true">
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
          </div>

          {galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-md bg-primary-50">
                  <Image src={img.url} alt={chalet.name} fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </div>
          )}

          <h1 className="mt-6 text-2xl font-bold text-foreground md:text-3xl">{chalet.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" /> {chalet.address}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {activeBookingTypes.map((key) => (
              <Badge key={key} variant="outline">
                {BOOKING_TYPE_LABELS[key]}
              </Badge>
            ))}
          </div>

          <Separator className="my-6" />

          <h2 className="mb-2 text-lg font-semibold text-foreground">About this chalet</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{chalet.description}</p>

          {chalet.amenities && chalet.amenities.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="mb-3 text-lg font-semibold text-foreground">Amenities</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chalet.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {amenity.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={amenity.iconUrl} alt="" className="h-5 w-5 shrink-0" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full bg-primary-100" />
                    )}
                    {amenity.name}
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator className="my-6" />

          <h2 className="mb-3 text-lg font-semibold text-foreground">Cancellation policy</h2>
          <p className="leading-relaxed text-muted-foreground">{chalet.cancellationPolicy}</p>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="space-y-5 p-5">
              {chalet.showPrice && (
                <p className="text-2xl font-bold text-primary-700">
                  {formatCurrency(chalet.basePrice)}
                  <span className="text-sm font-normal text-muted-foreground"> / night</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0 text-primary-600" /> {chalet.maxGuests} guests
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BedDouble className="h-4 w-4 shrink-0 text-primary-600" /> {chalet.bedroomsCount} rooms
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bath className="h-4 w-4 shrink-0 text-primary-600" /> {chalet.bathroomsCount} baths
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Moon className="h-4 w-4 shrink-0 text-primary-600" /> {chalet.minNights}-{chalet.maxNights} nights
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0 text-primary-600" />
                Check-in {chalet.checkInTime.slice(0, 5)} — Check-out {chalet.checkOutTime.slice(0, 5)}
              </div>

              <Separator />

              {/* Only the role crosses the client boundary — never the session
                  itself, which carries the access/refresh tokens. */}
              <ChaletBookingWidget chalet={chalet} isLoggedIn={!!session} role={session?.role ?? null} />

              <Button asChild className="w-full" variant="outline" size="lg">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Contact via WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
