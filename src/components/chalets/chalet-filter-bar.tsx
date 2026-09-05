"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = ["Active", "UnderMaintenance", "Inactive"] as const;
// Sortable field names aren't documented beyond the param names themselves
// (confirmed via the live Swagger docs) — these are a reasonable guess based
// on the fields Chalet actually has. If sorting silently has no effect,
// re-check the real accepted values against Swagger.
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "basePrice", label: "Base price" },
  { value: "createdAt", label: "Date added" },
];

/**
 * Client Component: search/status/price/sort controls for the dashboard's
 * "All Chalets" list — every change rewrites the URL's query string (and
 * resets `page` back to 1), so the Server Component page above just re-reads
 * `searchParams` and refetches. Matches the same URL-driven pattern
 * `ChaletPagination` already uses for page numbers.
 */
export function ChaletFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [minPrice, setMinPrice] = React.useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = React.useState(searchParams.get("maxPrice") ?? "");

  // Keeps the controlled inputs in sync when the URL changes from outside a
  // keystroke here — e.g. "Reset filters" below, or back/forward.
  React.useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
  }, [searchParams]);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const sortBy = searchParams.get("sortBy") ?? "";
  const sortDescending = searchParams.get("sortDescending") === "true";
  const hasActiveFilters =
    searchParams.get("search") ||
    searchParams.get("status") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice") ||
    sortBy;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        className="flex min-w-[220px] flex-1 items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search: search.trim() || null });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or address"
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParams({ status: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ minPrice: minPrice.trim() || null, maxPrice: maxPrice.trim() || null });
        }}
      >
        <Input
          type="number"
          min={0}
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          min={0}
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28"
        />
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      <Select value={sortBy || "none"} onValueChange={(value) => updateParams({ sortBy: value === "none" ? null : value })}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Default order</SelectItem>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sortBy && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={sortDescending ? "Sort ascending" : "Sort descending"}
          onClick={() => updateParams({ sortDescending: sortDescending ? null : "true" })}
        >
          {sortDescending ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
        </Button>
      )}

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="h-4 w-4" /> Reset filters
        </Button>
      )}
    </div>
  );
}
