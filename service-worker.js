const CACHE = "bydrrm-riverwatch-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./official-data.json"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // GitHub Pages is static. Keep the existing frontend /api/sync call working
  // by serving the repository's scheduled official-data snapshot instead.
  if (url.origin === self.location.origin && url.pathname === "/api/sync") {
    event.respondWith(
      fetch("./official-data.json?ts=" + Date.now(), { cache: "no-store" })
        .catch(() => caches.match("./official-data.json"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
  );
});
