import { Home } from "lucide-react";
import { ChaletCard } from "@/components/chalets/chalet-card";
import { getAllChalets } from "@/lib/api/chalet";

/**
 * Async Server Component — fetches `GET /api/Chalet` on the server and
 * streams in under a <Suspense> boundary from the home page. If the backend
 * is unreachable we degrade gracefully instead of throwing (the nearest
 * error.tsx is reserved for truly unexpected failures).
 */
export async function ChaletList() {
  let chalets: Awaited<ReturnType<typeof getAllChalets>> = [];
  let failed = false;

  try {
    chalets = await getAllChalets();
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        Couldn&apos;t load chalets right now. Try refreshing the page in a moment.
      </div>
    );
  }

  if (chalets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        <Home className="h-10 w-10 text-primary-200" />
        <p>No chalets available right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {chalets.map((chalet) => (
        <ChaletCard key={chalet.id} chalet={chalet} />
      ))}
    </div>
  );
}
