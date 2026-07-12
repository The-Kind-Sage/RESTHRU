// Server Component gate for the superadmin console. The admin shell (sidebar,
// header, command palette) lives in ./shell as a Client Component; this layout
// runs the auth check on the server BEFORE any of that renders, so an
// unauthenticated or wrong-role user can never see admin chrome flash.
import AdminShell from './shell';
import { guardArea } from '@/lib/auth-guard';
import { SUPERADMIN_AUTH_ROUTES } from '@/lib/constants';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Primary gate is proxy.ts; this is the belt-and-suspenders server check.
  // Only SUPER_ADMIN / ADMIN may render the console — any other authenticated
  // role is bounced to their own area, unauthenticated users to the admin login.
  // AdminShell still renders /superadmin/login without chrome (public path).
  await guardArea({
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    loginPath: '/superadmin/login',
    publicPaths: SUPERADMIN_AUTH_ROUTES,
    // A logged-in non-admin should land on the admin login, not their dashboard.
    wrongRoleRedirect: '/superadmin/login',
  });

  return <AdminShell>{children}</AdminShell>;
}
