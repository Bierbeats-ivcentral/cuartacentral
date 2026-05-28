/* ============================================
   IV CENTRAL — service-worker.js
   Push Notifications + Offline Cache

   FIX: paths de STATIC_ASSETS corregidos para
   coincidir con la estructura real del proyecto:
   assets/css/ y assets/js/ en lugar de raíz.
   ============================================ */

const CACHE_NAME = "iv-central-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/css/styles.css",
  "/assets/css/styles-extra.css",
  "/assets/css/subscribe.css",
  "/assets/js/data.js",
  "/assets/js/main.js",
  "/assets/js/subscribe.js",
  "/logo-iv-central.svg",
  "/manifest.json",
];

// ── INSTALL: pre-cache static assets ──────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: network-first, cache fallback ──────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes("fonts.googleapis.com") &&
      !url.hostname.includes("fonts.gstatic.com")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── PUSH: receive and display notification ────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "IV CENTRAL", body: "Tienes un nuevo mensaje." };
  try {
    data = event.data ? event.data.json() : data;
  } catch (_) {}

  const options = {
    body: data.body || "",
    icon: "/logo-iv-central.svg",
    badge: "/logo-iv-central.svg",
    tag: data.tag || "iv-central-notif",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "IV CENTRAL", options)
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
