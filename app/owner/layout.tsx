// Server Component — no 'use client' directive.
// The sidebar and header are Client Components rendered inside, but keeping the
// layout itself as a Server Component enables streaming and lets us run the
// auth gate on the server before any dashboard content renders.
import { Suspense } from 'react';
import DashboardShell from './shell';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { guardArea } from '@/lib/auth-guard';
import { DASHBOARD_AUTH_ROUTES } from '@/lib/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: proxy.ts is the primary gate for /owner, but
  // this repeats the check at the layout level so a request that somehow
  // reaches this Server Component without passing through the proxy
  // (misconfigured matcher, cached/replayed HTML, direct RSC fetch) still can't
  // render authenticated content. Owner + legacy STAFF only.
  await guardArea({
    allowedRoles: ['RESTAURANT_OWNER', 'STAFF'],
    loginPath: '/owner/login',
    publicPaths: DASHBOARD_AUTH_ROUTES,
  });

  return (
    // Shell is a Client Component that owns sidebar + header state.
    // Wrapping children in Suspense lets each sub-page stream independently
    // so the sidebar appears immediately while page data is still loading.
    <DashboardShell>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </DashboardShell>
  );
}
