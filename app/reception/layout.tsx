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
  // The proxy is the primary gate (unauthenticated /reception → /dashboard/login,
  // WAITER → /order); this repeats the check at the layout level. Reception is
  // usable by the receptionist and by the owner/legacy-staff running the till.
  await guardArea({
    allowedRoles: ['RECEPTIONIST', 'RESTAURANT_OWNER', 'STAFF'],
    loginPath: '/dashboard/login',
  });

  return (
    <ReceptionShell>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ReceptionShell>
  );
}
