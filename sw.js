const CACHE_NAME = "pro-editor-v1";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          "./",
          "./index.html",
          "./manifest.json"
        ]);
      })
      .catch(err => {
        console.error("Cache addAll failed:", err);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
