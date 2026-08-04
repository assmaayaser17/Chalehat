import { Home } from "lucide-react";
import { ChaletCard } from "@/components/chalets/chalet-card";
import { ChaletPagination } from "@/components/chalets/chalet-pagination";
import { getChaletsPage } from "@/lib/api/chalet";

const PAGE_SIZE = 9;

/**
 * Async Server Component — fetches `GET /api/Chalet` (paginated) on the
 * server and streams in under a <Suspense> boundary from the home page. If
 * the backend is unreachable we degrade gracefully instead of throwing (the
 * nearest error.tsx is reserved for truly unexpected failures).
 */
export async function ChaletList({ page }: { page: number }) {
  let result: Awaited<ReturnType<typeof getChaletsPage>> | null = null;
  let failed = false;

  try {
    result = await getChaletsPage(page, PAGE_SIZE);
  } catch {
    failed = true;
  }

  if (failed || !result) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        Couldn&apos;t load chalets right now. Try refreshing the page in a moment.
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        <Home className="h-10 w-10 text-primary-200" />
        <p>No chalets available right now.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((chalet) => (
          <ChaletCard key={chalet.id} chalet={chalet} />
        ))}
      </div>
      {result.totalPages > 1 && <ChaletPagination page={result.page} totalPages={result.totalPages} />}
    </>
  );
}
