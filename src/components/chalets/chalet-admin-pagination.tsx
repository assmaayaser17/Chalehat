import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function PageLink({
  href,
  active,
  disabled,
  children,
  label,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-hidden
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground/40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg border font-semibold transition-colors",
        active
          ? "border-primary-800 bg-primary-800 text-white"
          : "border-border bg-white text-primary-800 hover:bg-primary-800 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Same idea as `ChaletPagination` (pure `?page=N` links, no client state),
 * but generalized with a `basePath` and the rest of the current filters
 * (`extraParams`, everything except `page`) so it works from any dashboard
 * list instead of being hardcoded to the homepage.
 */
export function ChaletAdminPagination({
  basePath,
  page,
  totalPages,
  extraParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  extraParams: URLSearchParams;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(extraParams);
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav aria-label="Chalet pages" className="mt-6 flex flex-wrap justify-center gap-2">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {pages.map((p) => (
        <PageLink key={p} href={hrefFor(p)} active={p === page} label={`Page ${p}`}>
          {p}
        </PageLink>
      ))}
      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}
