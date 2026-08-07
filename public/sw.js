const CACHE = "campus-connect-v1";
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => self.clients.claim());
self.addEventListener("fetch", (e) => {
  // Network-first is safest here since your data is live Firestore/Firebase
  // Auth traffic — you don't want a stale cache serving old events.
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});