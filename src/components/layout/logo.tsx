import Link from "next/link";

/**
 * Small inline SVG mark echoing the Chalehat logo (palm + chalet + waves)
 * in the brand's teal/gold palette — avoids shipping a raster image.
 * Pure presentation, so it stays a Server Component.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ?? "flex items-center gap-2"}>
      <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
        <path
          d="M24 33c-8 2-14 0-18-3.5 5 1 11 .5 18-1.5 7 2 13 2.5 18 1.5-4 3.5-10 5.5-18 3.5Z"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M13 26 24 19l11 7v9a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1v-9Z"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="12" r="2.5" fill="hsl(var(--accent))" />
        <path
          d="M19 19c-1-4-4-6-7-6 1 3 3 5 7 6Z"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-bold text-primary-800">Chalehat</span>
    </Link>
  );
}
