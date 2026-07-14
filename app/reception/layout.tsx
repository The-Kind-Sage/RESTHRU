// Server Component — runs the auth gate on the server before the reception
// shell (Client Component) renders. Previously this was a plain pass-through
// wrapper with no auth check, relying entirely on proxy.ts.
import { Suspense } from 'react';
import ReceptionShell from './shell';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { guardArea } from '@/lib/auth-guard';

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy is the primary gate (unauthenticated /reception → /owner/login,
  // WAITER → /order, RESTAURANT_OWNER → /owner); this repeats the check at the
  // layout level.
  await guardArea({
    allowedRoles: ['RECEPTIONIST'],
    loginPath: '/owner/login',
  });

  return (
    <ReceptionShell>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ReceptionShell>
  );
}
