"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Query key prefixes we consider "heavy aggregates" — their data
// barely changes between navigations, so we cache them for longer.
const AGGREGATE_PREFIXES = ["dashboard", "stats", "revenue", "reports", "analytics"];

function isAggregate(queryKey: readonly unknown[]): boolean {
  const first = String(queryKey[0] ?? "").toLowerCase();
  return AGGREGATE_PREFIXES.some((p) => first.includes(p));
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default: 60 s stale window — data won't re-fetch on window focus
        // or component remount unless it's older than 1 minute.
        staleTime: 60 * 1000,

        // Never refetch on window focus — admin/dashboard data is
        // fetched on navigation; background polling is noisy here.
        refetchOnWindowFocus: false,

        // Retry failed queries once before showing an error.
        retry: 1,

        // Don't throw on error — let individual components handle it.
        throwOnError: false,
      },
    },
    // Per-query overrides via the queryCache observer.
    // Aggregate queries get a 5-minute stale window.
  });
}

// Singleton on the server to avoid creating a new client every request.
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a fresh client.
    return makeQueryClient();
  }
  // Browser: reuse the same client across navigations.
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures we don't recreate the client on every render,
  // even when the component tree re-mounts (e.g. hot reload in dev).
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
