import type { Metadata } from "next";
import { ImageUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PendingChaletImages, type PendingImage } from "@/components/admin/pending-chalet-images";
import { getAllChalets } from "@/lib/api/chalet";
import { getChaletImages } from "@/lib/api/chalet-images";

export const metadata: Metadata = { title: "Pending Images" };

/**
 * Server Component — role gating happens in `middleware.ts` (SuperAdmin/
 * SystemAdmin only), same as `/dashboard/statistics`.
 *
 * There's no endpoint that returns pending images across every chalet at
 * once, so this assembles the queue itself: one `GET /api/chalet/{id}/images`
 * call per chalet, run in parallel and filtered down to the unapproved ones.
 * `Promise.allSettled` so one chalet's images failing to load doesn't blank
 * the whole queue.
 */
export default async function PendingImagesPage() {
  const chalets = await getAllChalets();

  const results = await Promise.allSettled(
    chalets.map(async (chalet) => ({ chalet, images: await getChaletImages(chalet.id) })),
  );

  const pending: PendingImage[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { chalet, images } = result.value;
    for (const image of images) {
      if (!image.isApproved && !image.rejectionReason) pending.push({ ...image, chaletName: chalet.name });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pending Images"
        description="Photos chalet owners have uploaded, waiting on your approval — across every chalet."
      />

      {pending.length === 0 ? (
        <EmptyState icon={ImageUp} title="Nothing to review" description="Every uploaded photo has been approved." />
      ) : (
        <PendingChaletImages images={pending} />
      )}
    </div>
  );
}
