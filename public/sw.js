const CACHE = "resthru-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/checkout",
  "/dashboard/reception",
  "/dashboard/crm",
  "/dashboard/shifts",
  "/dashboard/invoices",
  "/dashboard/tables",
  "/dashboard/menu",
  "/dashboard/staff",
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/prints",
  "/dashboard/settings",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (navigator.onLine) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => {
            if (request.url.startsWith(self.location.origin)) {
              cache.put(request, clone);
            }
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
