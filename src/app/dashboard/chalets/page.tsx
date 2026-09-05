import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Home, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChaletCard } from "@/components/chalets/chalet-card";
import { ChaletManageMenu } from "@/components/chalets/chalet-manage-menu";
import { ChaletFilterBar } from "@/components/chalets/chalet-filter-bar";
import { ChaletAdminPagination } from "@/components/chalets/chalet-admin-pagination";
import { ChaletGridSkeleton } from "@/components/chalets/chalet-grid-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api/client";
import { getChaletsPage, getMyChalets, type ChaletListFilters } from "@/lib/api/chalet";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Chalets" };

const PAGE_SIZE = 8;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortDescending?: string;
  }>;
}

async function ChaletsGrid({
  isSuperAdmin,
  page,
  filters,
}: {
  isSuperAdmin: boolean;
  page: number;
  filters: ChaletListFilters;
}) {
  let chalets: Awaited<ReturnType<typeof getMyChalets>> = [];
  let totalPages = 1;
  let errorMessage: string | null = null;

  try {
    if (isSuperAdmin) {
      const result = await getChaletsPage(page, PAGE_SIZE, filters);
      chalets = result.items;
      totalPages = result.totalPages;
    } else {
      // "My Chalets" doesn't offer filters/pagination — a ChaletAdmin owns a
      // small enough number of chalets that a single page is plenty.
      chalets = await getMyChalets();
    }
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

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.minPrice || filters.maxPrice);

  if (chalets.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title={hasActiveFilters ? "No chalets match these filters" : isSuperAdmin ? "No chalets in the system yet" : "No chalets assigned to you yet"}
        description={
          hasActiveFilters
            ? "Try loosening the search, status, or price range."
            : isSuperAdmin
              ? "Add the first chalet to get the catalog started."
              : "Ask a Super Admin to create a chalet and assign it to you."
        }
        action={
          isSuperAdmin && !hasActiveFilters ? (
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
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {chalets.map((chalet) => (
          <div key={chalet.id} className="space-y-3">
            <ChaletCard chalet={chalet} />
            <ChaletManageMenu chaletId={chalet.id} isSuperAdmin={isSuperAdmin} />
          </div>
        ))}
      </div>
      {isSuperAdmin && totalPages > 1 && (
        <ChaletAdminPagination
          basePath="/dashboard/chalets"
          page={page}
          totalPages={totalPages}
          extraParams={buildParams(filters)}
        />
      )}
    </>
  );
}

function buildParams(filters: ChaletListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (typeof filters.minPrice === "number") params.set("minPrice", String(filters.minPrice));
  if (typeof filters.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDescending) params.set("sortDescending", "true");
  return params;
}

export default async function MyChaletsPage({ searchParams }: PageProps) {
  const session = await getSession();
  // SuperAdmin doesn't personally own chalets — `/my-chalets` is ChaletAdmin-only
  // and would 403 for them, so they see every chalet in the system instead.
  const isSuperAdmin = session?.role === "SuperAdmin";

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters: ChaletListFilters = {
    search: params.search,
    status:
      params.status === "Active" || params.status === "UnderMaintenance" || params.status === "Inactive"
        ? params.status
        : undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sortBy: params.sortBy,
    sortDescending: params.sortDescending === "true",
  };

  return (
    <div className="space-y-6">
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

      {isSuperAdmin && <ChaletFilterBar />}

      <Suspense fallback={<ChaletGridSkeleton count={3} />}>
        <ChaletsGrid isSuperAdmin={isSuperAdmin} page={page} filters={filters} />
      </Suspense>
    </div>
  );
}
