import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Bath,
  CalendarClock,
  Info,
  MapPin,
  MessageCircle,
  Moon,
  Sparkle,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatItem } from "@/components/shared/stat-item";
import { ApiError } from "@/lib/api/client";
import { getChaletById } from "@/lib/api/chalet";
import { getChaletSeasonalPrices } from "@/lib/api/chalet-seasonal-prices";
import { getChaletWeekdayPrices } from "@/lib/api/chalet-weekday-prices";
import { getSession } from "@/lib/auth/session";
import { BOOKING_TYPE_LABELS, cn, formatCurrency, formatDate, getActiveBookingTypes } from "@/lib/utils";
import { ChaletBookingWidget } from "@/components/chalets/chalet-booking-widget";
import type { ChaletSeasonalPrice, ChaletWeekdayPrice } from "@/lib/api/types";

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
  const coverImage = chalet.coverImageUrl ?? approvedImages[0]?.url;
  const galleryImages = approvedImages.filter((img) => img.url !== coverImage);
  const heroSideImages = galleryImages.slice(0, 4);
  const extraCount = Math.max(0, galleryImages.length - heroSideImages.length);
  const activeBookingTypes = getActiveBookingTypes(chalet.allowedBookingTypes);
  const whatsappHref = chalet.whatsAppNumber
    ? `https://wa.me/${chalet.whatsAppNumber.replace(/^0/, "970")}`
    : null;

  // Seasonal/weekday prices are separate resources, not nested on the chalet
  // itself — non-critical to the page, so a failure here just hides the
  // "Special pricing" section instead of breaking the whole listing.
  let seasonalPrices: ChaletSeasonalPrice[] = [];
  let weekdayPrices: ChaletWeekdayPrice[] = [];
  try {
    [seasonalPrices, weekdayPrices] = await Promise.all([
      getChaletSeasonalPrices(chalet.id),
      getChaletWeekdayPrices(chalet.id),
    ]);
  } catch {
    // Swallowed intentionally — see comment above.
  }
  const hasSpecialRates = seasonalPrices.length > 0 || weekdayPrices.length > 0;

  return (
    <div className="container py-8 md:py-10">
      {/* Hero gallery */}
      {!coverImage ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-primary-50">
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
        </div>
      ) : heroSideImages.length === 0 ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-primary-50 md:h-[440px]">
          <Image src={coverImage} alt={chalet.name} fill className="object-cover" priority />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:h-[440px] md:grid-cols-4 md:grid-rows-2">
          <div className="relative col-span-2 row-span-2 aspect-video overflow-hidden rounded-2xl bg-primary-50 md:aspect-auto">
            <Image src={coverImage} alt={chalet.name} fill className="object-cover" priority />
          </div>
          {heroSideImages.map((img, i) => (
            <div key={img.id} className="relative hidden overflow-hidden rounded-xl bg-primary-50 md:block">
              <Image src={img.url} alt={chalet.name} fill className="object-cover" sizes="220px" />
              {i === heroSideImages.length - 1 && extraCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-bold text-white">
                  +{extraCount} more
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            {activeBookingTypes.map((key) => (
              <Badge key={key} variant="accent">
                {BOOKING_TYPE_LABELS[key]}
              </Badge>
            ))}
          </div>

          <h1 dir="auto" className="mt-3 text-2xl font-extrabold text-primary-800 md:text-3xl">
            {chalet.name}
          </h1>
          <p dir="auto" className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" /> {chalet.address}
          </p>
          {typeof chalet.averageRating === "number" && (chalet.reviewsCount ?? 0) > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
              <span className="font-semibold text-foreground">{chalet.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({chalet.reviewsCount} review{chalet.reviewsCount === 1 ? "" : "s"})
              </span>
            </div>
          )}

          <Separator className="my-6" />

          <h2 className="mb-2 text-lg font-semibold text-primary-800">About this chalet</h2>
          <p dir="auto" className="whitespace-pre-line leading-relaxed text-muted-foreground">
            {chalet.description}
          </p>

          {chalet.amenities && chalet.amenities.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="mb-3 text-lg font-semibold text-primary-800">Amenities &amp; services</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chalet.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    dir="auto"
                    className="flex items-center gap-3 rounded-xl border border-border bg-sand-50 p-3.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700">
                      {amenity.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={amenity.iconUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Sparkle className="h-4 w-4" />
                      )}
                    </span>
                    <span className="text-sm font-medium text-foreground">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {hasSpecialRates && (
            <>
              <Separator className="my-6" />
              <h2 className="mb-3 text-lg font-semibold text-primary-800">Special pricing</h2>
              <div className="space-y-4">
                {seasonalPrices.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {seasonalPrices.map((linked) => (
                      <div key={linked.id} className="rounded-xl border border-accent-200 bg-accent-100/50 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
                          <Sparkle className="h-3.5 w-3.5 fill-current" /> Seasonal price
                        </p>
                        <p dir="auto" className="text-sm font-semibold text-foreground">
                          {linked.seasonName ?? `Season #${linked.seasonId}`}
                        </p>
                        {linked.seasonStartDate && linked.seasonEndDate && (
                          <p className="text-xs text-muted-foreground">
                            {linked.seasonStartDate} – {linked.seasonEndDate}
                          </p>
                        )}
                        <p className="text-lg font-bold tabular-nums text-accent-700">
                          {formatCurrency(linked.fullDayPrice)}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          <span>Morning {formatCurrency(linked.morningPrice)}</span>
                          <span>Evening {formatCurrency(linked.eveningPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {weekdayPrices.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {weekdayPrices.map((rule) => (
                      <div key={rule.id} className="rounded-xl border border-border bg-sand-50 p-4">
                        <p className="text-sm font-semibold text-foreground">{rule.day}</p>
                        <p className="text-lg font-bold tabular-nums text-foreground">
                          {formatCurrency(rule.fullDayPrice)}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          <span>Morning {formatCurrency(rule.morningPrice)}</span>
                          <span>Evening {formatCurrency(rule.eveningPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {chalet.reviews && chalet.reviews.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="mb-3 text-lg font-semibold text-primary-800">Reviews</h2>
              <div className="space-y-3">
                {chalet.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-sand-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span dir="auto" className="text-sm font-semibold text-foreground">
                        {review.userFullName || "Guest"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < review.rating ? "fill-accent-500 text-accent-500" : "text-muted-foreground/25",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p dir="auto" className="mt-1.5 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    {review.createdAt && (
                      <p className="mt-1.5 text-xs text-muted-foreground/70">{formatDate(review.createdAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator className="my-6" />

          <h2 className="mb-3 text-lg font-semibold text-primary-800">Location</h2>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-sand-50 p-10 text-center">
            <MapPin className="h-9 w-9 text-primary-300" />
            <p dir="auto" className="max-w-md text-sm text-muted-foreground">
              {chalet.address}
            </p>
          </div>

          <Separator className="my-6" />

          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary-800">
            <Info className="h-5 w-5 text-destructive" /> Cancellation policy
          </h2>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <p dir="auto" className="text-sm leading-relaxed text-muted-foreground">
              {chalet.cancellationPolicy}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 overflow-hidden rounded-[28px] border-border bg-sand-100/70 shadow-md backdrop-blur-md">
            <CardContent className="space-y-5 p-6">
              {chalet.showPrice && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Starting from</p>
                  <p className="text-2xl font-extrabold text-accent-700">
                    {formatCurrency(chalet.basePrice)}
                    <span className="text-sm font-normal text-muted-foreground"> / night</span>
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Morning <strong className="font-semibold text-foreground">{formatCurrency(chalet.morningPrice)}</strong>
                    </span>
                    <span>
                      Evening <strong className="font-semibold text-foreground">{formatCurrency(chalet.eveningPrice)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {hasSpecialRates && (
                <div className="space-y-1.5 rounded-xl bg-accent-100/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent-800">Special rates</p>
                  {weekdayPrices.slice(0, 2).map((rule) => (
                    <div key={rule.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{rule.day}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(rule.fullDayPrice)}</span>
                    </div>
                  ))}
                  {seasonalPrices.slice(0, 2).map((linked) => (
                    <div key={linked.id} className="flex justify-between text-xs text-muted-foreground">
                      <span dir="auto">{linked.seasonName ?? `Season #${linked.seasonId}`}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(linked.fullDayPrice)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-4">
                <StatItem icon={Users} value={chalet.maxGuests} label="Guests" />
                <StatItem icon={BedDouble} value={chalet.bedroomsCount} label="Rooms" />
                <StatItem icon={Bath} value={chalet.bathroomsCount} label="Baths" />
                <StatItem icon={Moon} value={`${chalet.minNights}–${chalet.maxNights}`} label="Nights" />
              </div>

              <Separator />

              {(chalet.checkInTime || chalet.checkOutTime) && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4 shrink-0 text-primary-600" />
                    {chalet.checkInTime && `Check-in ${chalet.checkInTime.slice(0, 5)}`}
                    {chalet.checkInTime && chalet.checkOutTime && " — "}
                    {chalet.checkOutTime && `Check-out ${chalet.checkOutTime.slice(0, 5)}`}
                  </div>

                  <Separator />
                </>
              )}

              {/* Only the role crosses the client boundary — never the session
                  itself, which carries the access/refresh tokens. */}
              <ChaletBookingWidget chalet={chalet} isLoggedIn={!!session} role={session?.role ?? null} />

              {whatsappHref && (
                <Button
                  asChild
                  className="w-full bg-[#25D366] text-white shadow-md hover:bg-[#1ebe5b]"
                  size="lg"
                >
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> Contact via WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
