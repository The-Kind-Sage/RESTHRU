'use client';

// Shared loading-skeleton primitives for the superadmin panel (C1 — G3).
// Before this, the section had three different loading patterns: some pages
// full-page-gated on a "Loading..." text node, some rendered immediately and
// showed "No data available" text that looked identical to a genuinely-empty
// section, and the two server-component pages (Dashboard, Restaurants list)
// had no client loading state at all. These three primitives are now the one
// pattern used everywhere a fetch is in flight.

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/** A row of KPI-card-shaped skeletons, matching the `grid ... gap-4` KPI rows used throughout the section. */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card border-border shadow-sm">
          <CardContent className="py-6 px-6 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Generic skeleton for a single card's content area — the direct replacement
 * for every `{!data ? <div className="text-center py-12 ...">No data</div> : ...}`
 * branch across the section. Never render this for a genuinely-empty result;
 * only while the fetch is actually in flight (`data === null`).
 */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full-page composite skeleton for pages that currently full-page-gate on
 * `if (!data) return <div>Loading...</div>` (Financials, Pipeline,
 * Subscriptions, Restaurant detail).
 */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <KpiSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><SectionSkeleton /></CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><SectionSkeleton /></CardContent>
        </Card>
      </div>
    </div>
  );
}
