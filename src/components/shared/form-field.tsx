import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + error-message wrapper shared by every react-hook-form
 * field in the app. Not a Client Component itself — it's a plain
 * presentational leaf that gets pulled into whichever client form renders it.
 */
export function FormField({
  id,
  label,
  error,
  labelAction,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Optional trailing element next to the label, e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
