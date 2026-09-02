import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Megaphone, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import { getAdvertisementById } from "@/lib/api/advertisements";
import { getAdvertisementCategories } from "@/lib/api/advertisement-categories";
import { resolveAdLocationDisplay } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadAd(idParam: string) {
  const id = Number(idParam);
  if (!Number.isFinite(id)) return null;
  try {
    return await getAdvertisementById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ad = await loadAd(id);
  if (!ad) return { title: "Advertisement not found" };
  return { title: ad.name, description: ad.description?.slice(0, 150) };
}

export default async function AdDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ad = await loadAd(id);
  if (!ad) notFound();

  const categories = await getAdvertisementCategories();
  const categoryName = ad.categoryName ?? categories.find((c) => c.id === ad.categoryId)?.name;

  const [coverImage, ...restImages] = ad.images;
  const whatsappHref = ad.phoneNumber ? `https://wa.me/${ad.phoneNumber.replace(/^0/, "970")}` : null;

  return (
    <div className="container max-w-4xl space-y-8 py-8 md:py-10">
      {coverImage ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-primary-50">
          <Image src={coverImage.url} alt={ad.name} fill sizes="100vw" className="object-cover" priority />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-primary-50 text-primary-300">
          <Megaphone className="h-20 w-20" />
        </div>
      )}

      {restImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {restImages.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-primary-50">
              <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div dir="auto" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-foreground">{ad.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
              {resolveAdLocationDisplay(ad)}
            </p>
          </div>
          {categoryName && <Badge>{categoryName}</Badge>}
        </div>

        <Separator />

        <p className="whitespace-pre-line text-foreground">{ad.description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {whatsappHref && (
          <Button asChild className="bg-[#25D366] text-white shadow-md hover:bg-[#1ebe5b]">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Contact via WhatsApp
            </a>
          </Button>
        )}
        {ad.phoneNumber && (
          <Button variant="outline" asChild>
            <a href={`tel:${ad.phoneNumber}`}>
              <Phone /> {ad.phoneNumber}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
