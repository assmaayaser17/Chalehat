import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function PageLink({
  page,
  active,
  disabled,
  children,
  label,
}: {
  page: number;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground/40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/?page=${page}#chalets`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border font-bold transition-colors",
        active
          ? "border-primary-800 bg-primary-800 text-white"
          : "border-border bg-white text-primary-800 hover:bg-primary-800 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

/** Presentational — pure `?page=N` links, no client state, so this stays a Server Component. */
export function ChaletPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Chalet pages" className="mt-10 flex justify-center gap-2">
      <PageLink page={page - 1} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {pages.map((p) => (
        <PageLink key={p} page={p} active={p === page} label={`Page ${p}`}>
          {p}
        </PageLink>
      ))}
      <PageLink page={page + 1} disabled={page >= totalPages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}
