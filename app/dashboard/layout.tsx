// Server Component — no 'use client' directive.
// The sidebar and header are Client Components rendered inside, but
// keeping the layout itself as a Server Component enables streaming and
// prevents the entire shell from being included in the client JS bundle.
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from './shell';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getSession } from '@/lib/auth';
import { DASHBOARD_AUTH_ROUTES } from '@/lib/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: middleware.ts is the primary gate for /dashboard,
  // but this repeats the same check at the layout level so a request that
  // somehow reaches this Server Component without having passed through
  // middleware (misconfigured matcher, cached/replayed HTML, etc.) still
  // can't render authenticated content.
  const pathname = (await headers()).get('x-pathname') || '';
  const isPublicRoute = DASHBOARD_AUTH_ROUTES.includes(pathname as typeof DASHBOARD_AUTH_ROUTES[number]);

  if (!isPublicRoute) {
    const session = await getSession();
    if (!session) redirect(`/dashboard/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
    if (session.role === 'RECEPTIONIST') redirect('/reception');
    if (session.role === 'WAITER') redirect('/order');
  }

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
