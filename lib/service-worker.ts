'use client';

const CACHE_PREFIX = 'resthru-';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// Logout only clears the session cookie server-side — without this, the SW's
// precached /owner snapshot in Cache Storage can still be replayed
// (e.g. offline) after the user has signed out. Unregister and drop the
// cache so the next visit is forced back to the network/login.
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k))
      );
    }
  } catch {
    // best-effort cleanup
  }
}
