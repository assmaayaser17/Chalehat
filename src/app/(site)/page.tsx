import { Suspense } from "react";
import { Waves } from "lucide-react";
import { ChaletList } from "@/components/chalets/chalet-list";
import { ChaletGridSkeleton } from "@/components/chalets/chalet-grid-skeleton";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary-900 text-white">
        <div className="container relative z-10 flex flex-col items-center gap-5 py-20 text-center md:py-28">
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-accent-200">
            <Waves className="h-4 w-4" /> An unforgettable seaside stay
          </span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            Book the most beautiful chalets <span className="text-accent-400">and holiday villas</span>
          </h1>
          <p className="max-w-xl text-primary-100 md:text-lg">
            Browse a curated selection of seaside chalets and message the owner directly to confirm your booking.
          </p>
          <a
            href="#chalets"
            className="mt-2 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-600"
          >
            Browse chalets
          </a>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary-950/40 to-transparent"
        />
      </section>

      <section id="chalets" className="container scroll-mt-20 py-14 md:py-20">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Available chalets</h2>
          <p className="text-muted-foreground">Choose from our featured chalets by your preferred location.</p>
        </div>
        <Suspense fallback={<ChaletGridSkeleton />}>
          <ChaletList />
        </Suspense>
      </section>
    </>
  );
}
