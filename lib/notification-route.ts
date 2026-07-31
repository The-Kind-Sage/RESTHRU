/**
 * Resolves where a notification's "View" action should navigate.
 *
 * An explicit `actionUrl` always wins. Otherwise order alerts route to the
 * orders screen of whichever portal the viewer is currently in — a single
 * notification fans out to owner, reception and waiters at once, so the
 * destination has to be resolved per-viewer rather than baked into the row
 * when it was written.
 *
 * Shared by the live alert popup (notification-sound) and the bell panel
 * (top-header) so both always agree on the destination.
 */
export function resolveNotificationUrl(n: {
  actionUrl?: string | null;
  relatedEntityType?: string | null;
}): string | null {
  if (n.actionUrl) return n.actionUrl;
  if (n.relatedEntityType !== 'Order') return null;
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname;
  if (path.startsWith('/owner')) return '/owner/orders';
  if (path.startsWith('/reception')) return '/reception/orders';
  if (path.startsWith('/order')) return '/order';
  return null;
}
