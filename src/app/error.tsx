"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root-segment error boundary. Renders *inside* the existing root layout's
 * <html>/<body> (unlike global-error.tsx, which only fires when the root
 * layout itself throws and must render a full replacement document) — so
 * this must never render its own <html>/<body>, or React ends up with a
 * nested <html> inside <body>, which breaks hydration.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We&apos;re sorry for the inconvenience. Try again or go back to the home page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
