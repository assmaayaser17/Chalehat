import { Suspense } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { ChaletList } from "@/components/chalets/chalet-list";
import { ChaletGridSkeleton } from "@/components/chalets/chalet-grid-skeleton";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10 space-y-6">
        <h1 className="text-3xl font-extrabold leading-tight text-primary-800 md:text-[40px]">
          Discover the Finest Chalets
        </h1>

        {/* Visual only for now — not wired to real filtering/search logic. */}
        <div className="rounded-3xl border border-border bg-sand-100 p-5 shadow-sm md:p-6">
          <div className="flex flex-col items-end gap-4 md:flex-row">
            <div className="w-full space-y-1.5 md:w-1/4">
              <label htmlFor="home-search-location" className="block text-xs font-medium text-muted-foreground">
                Location
              </label>
              <div className="relative">
                <input
                  id="home-search-location"
                  type="text"
                  placeholder="Where do you want to go?"
                  className="h-11 w-full rounded-xl border-0 bg-white px-3 pe-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <MapPin className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="w-full space-y-1.5 md:w-1/4">
              <label htmlFor="home-search-date" className="block text-xs font-medium text-muted-foreground">
                Date
              </label>
              <div className="relative">
                <input
                  id="home-search-date"
                  type="text"
                  placeholder="Choose a date"
                  className="h-11 w-full rounded-xl border-0 bg-white px-3 pe-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <CalendarDays className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="w-full space-y-1.5 md:w-1/4">
              <label htmlFor="home-search-type" className="block text-xs font-medium text-muted-foreground">
                Chalet type
              </label>
              <select
                id="home-search-type"
                className="h-11 w-full appearance-none rounded-xl border-0 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                defaultValue="All"
              >
                <option>All</option>
                <option>Family</option>
                <option>Youth</option>
                <option>Event</option>
              </select>
            </div>

            <a
              href="#chalets"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-800 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700 md:w-1/6"
            >
              <Search className="h-4 w-4" /> Search
            </a>
          </div>
        </div>
      </div>

      <section id="chalets" className="scroll-mt-24">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Available Chalets</h2>
          <p className="text-muted-foreground">Choose from our featured chalets by your preferred location.</p>
        </div>
        <Suspense key={page} fallback={<ChaletGridSkeleton />}>
          <ChaletList page={page} />
        </Suspense>
      </section>
    </div>
  );
}
