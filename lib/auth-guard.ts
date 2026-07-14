import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, type SessionUser } from '@/lib/auth';
import { homeForRole } from '@/lib/constants';

// Layout-level defense-in-depth gate. proxy.ts is the primary guard for
// every /owner, /reception, /order and /superadmin request; this repeats
// the same session + role check inside the Server Component layout so a request
// that somehow reaches the layout without passing through the proxy
// (misconfigured matcher, replayed/cached HTML, a direct RSC fetch) still can't
// render authenticated content.
//
// Relies on the `x-pathname` header that the proxy sets on every matched
// request. If the header is absent (proxy didn't run) we treat the path
// as non-public and fall through to the session check — failing closed.
export async function guardArea(opts: {
  allowedRoles: readonly string[];
  loginPath: string;
  publicPaths?: readonly string[];
  // Where to send an authenticated-but-wrong-role user. Defaults to their own
  // home (homeForRole). The superadmin console overrides this to its login page
  // so a non-admin isn't silently dumped on their dashboard.
  wrongRoleRedirect?: string;
}): Promise<SessionUser | null> {
  const pathname = (await headers()).get('x-pathname') || '';

  // Public sub-routes (login / forgot-password / reset) must render without a
  // session — skip the gate so we don't redirect-loop the login page itself.
  if (opts.publicPaths?.includes(pathname)) return null;

  const session = await getSession();
  if (!session) {
    redirect(`${opts.loginPath}?redirect=${encodeURIComponent(pathname || opts.loginPath)}`);
  }
  if (!opts.allowedRoles.includes(session.role)) {
    // Authenticated but wrong role for this area → send them where the caller
    // asked (default: their own home) rather than the forbidden screen.
    redirect(opts.wrongRoleRedirect ?? homeForRole(session.role));
  }
  return session;
}
