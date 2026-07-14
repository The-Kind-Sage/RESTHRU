// Server Component gate for the waiter order-entry area. Previously /order had
// no layout at all — only app/order/page.tsx did an inline session check, so
// any future route added under /order would have been unprotected. This gate
// covers the whole segment.
import { guardArea } from '@/lib/auth-guard';
import { ORDER_AUTH_ROUTES } from '@/lib/constants';

export default async function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy is the primary gate (unauthenticated /order → /order/login,
  // RECEPTIONIST → /reception, RESTAURANT_OWNER → /owner); this repeats the
  // check at the layout level. /order/login is public so the guard doesn't
  // redirect-loop the login page.
  await guardArea({
    allowedRoles: ['WAITER'],
    loginPath: '/order/login',
    publicPaths: ORDER_AUTH_ROUTES,
  });

  return <>{children}</>;
}
