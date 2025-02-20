const CACHE_NAME = "speedtyping-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/hands.js",
  "/src/styles.css",
  "/src/script.js",
  "/manifest.json",
  "/public/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
