"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Client Component boundary for React Query. Deliberately scoped to just the
 * staff dashboard subtree (see `/dashboard/staff/page.tsx`) rather than the
 * whole app — most pages here are plain Server Components and never touch
 * React Query at all.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
