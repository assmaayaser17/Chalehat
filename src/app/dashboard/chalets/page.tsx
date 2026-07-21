import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ImageUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChaletCard } from "@/components/chalets/chalet-card";
import { ChaletGridSkeleton } from "@/components/chalets/chalet-grid-skeleton";
import { ApiError } from "@/lib/api/client";
import { getAllChalets, getMyChalets } from "@/lib/api/chalet";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Chalets" };

async function MyChaletsGrid({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  let chalets: Awaited<ReturnType<typeof getMyChalets>> = [];
  let errorMessage: string | null = null;

  try {
    chalets = isSuperAdmin ? await getAllChalets() : await getMyChalets();
  } catch (err) {
    errorMessage = err instanceof ApiError ? err.message : "Couldn't load chalets.";
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-14 text-center text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (chalets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          {isSuperAdmin ? "No chalets in the system yet." : "You haven't added any chalets yet."}
        </p>
        <Button asChild>
          <Link href="/dashboard/chalets/new">
            <PlusCircle /> Add your first chalet
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {chalets.map((chalet) => (
        <div key={chalet.id} className="space-y-2">
          <ChaletCard chalet={chalet} />
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/dashboard/chalets/${chalet.id}/images`}>
              <ImageUp /> Manage images
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

export default async function MyChaletsPage() {
  const session = await getSession();
  // SuperAdmin doesn't personally own chalets — `/my-chalets` is ChaletAdmin-only
  // and would 403 for them, so they see every chalet in the system instead.
  const isSuperAdmin = session?.role === "SuperAdmin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isSuperAdmin ? "All Chalets" : "My Chalets"}</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin ? "Every chalet registered in the system." : "Manage the chalets you own."}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chalets/new">
            <PlusCircle /> Add chalet
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ChaletGridSkeleton count={3} />}>
        <MyChaletsGrid isSuperAdmin={isSuperAdmin} />
      </Suspense>
    </div>
  );
}
