// Server Component gate for the waiter order-entry area. Previously /order had
// no layout at all — only app/order/page.tsx did an inline session check, so
// any future route added under /order would have been unprotected. This gate
// covers the whole segment.
import { guardArea } from '@/lib/auth-guard';

export default async function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware is the primary gate (unauthenticated /order → /login,
  // RECEPTIONIST → /reception); this repeats the check at the layout level.
  await guardArea({
    allowedRoles: ['WAITER', 'RESTAURANT_OWNER', 'STAFF'],
    loginPath: '/login',
  });

  return <>{children}</>;
}
