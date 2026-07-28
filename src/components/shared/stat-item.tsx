import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One "slot" for a detail inside a card — icon in a tinted circle, bold
 * value, small label underneath. Presentational only.
 */
export function StatItem({
  icon: Icon,
  value,
  label,
  tone = "primary",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  tone?: "primary" | "accent";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          tone === "accent" ? "bg-accent-100 text-accent-700" : "bg-primary-100 text-primary-700",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold tabular-nums text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
