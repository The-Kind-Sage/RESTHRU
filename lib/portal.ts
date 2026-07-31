/**
 * The portal prefix ("/owner" or "/reception") for the page currently open.
 *
 * Several screens — the menu pages, the orders board — are shared between the
 * owner and reception portals. Their internal links must stay inside whichever
 * portal the user is in: sending a receptionist to an /owner/* route trips the
 * owner layout's role guard and bounces them to the login page.
 */
export function portalBase(): '/owner' | '/reception' {
  if (typeof window === 'undefined') return '/owner';
  return window.location.pathname.startsWith('/reception') ? '/reception' : '/owner';
}
