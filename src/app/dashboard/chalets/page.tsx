import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Home, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChaletCard } from "@/components/chalets/chalet-card";
import { ChaletManageMenu } from "@/components/chalets/chalet-manage-menu";
import { ChaletGridSkeleton } from "@/components/chalets/chalet-grid-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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
      <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-14 text-center text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (chalets.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title={isSuperAdmin ? "No chalets in the system yet" : "No chalets assigned to you yet"}
        description={
          isSuperAdmin
            ? "Add the first chalet to get the catalog started."
            : "Ask a Super Admin to create a chalet and assign it to you."
        }
        action={
          isSuperAdmin ? (
            <Button asChild>
              <Link href="/dashboard/chalets/new">
                <PlusCircle /> Add your first chalet
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {chalets.map((chalet) => (
        <div key={chalet.id} className="space-y-3">
          <ChaletCard chalet={chalet} />
          <ChaletManageMenu chaletId={chalet.id} />
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
    <div className="space-y-8">
      <PageHeader
        title={isSuperAdmin ? "All Chalets" : "My Chalets"}
        description={isSuperAdmin ? "Every chalet registered in the system." : "Manage the chalets you own."}
        actions={
          isSuperAdmin && (
            <Button asChild>
              <Link href="/dashboard/chalets/new">
                <PlusCircle /> Add chalet
              </Link>
            </Button>
          )
        }
      />

      <Suspense fallback={<ChaletGridSkeleton count={3} />}>
        <MyChaletsGrid isSuperAdmin={isSuperAdmin} />
      </Suspense>
    </div>
  );
}
