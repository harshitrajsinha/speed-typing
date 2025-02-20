const CACHE_NAME = "speedtyping-cache-v3";
const GOOGLE_FONTS_CACHE = "google-fonts-cache";
const urlsToCache = [
  "./",
  "./index.html",
  "./src/hands.js",
  "./src/styles.css",
  "./src/script.js",
  "./manifest.json",
  "./public/windy-hill.mp3",
  "./public/apple-touch-icon.png",
  "./public/favicon-16x16.png",
  "./public/favicon-32x32.png",
  "./public/favicon.ico",
  "./public/site.webmanifest",
  "./public/speed-typing-image.png",
  "./public/speed-typing-image-v2.png",
  "./public/fingers/left-fingers/q.png",
  "./public/fingers/right-fingers/right-rest.png",
  "./public/fingers/left-fingers/w.png",
  "./public/fingers/left-fingers/e.png",
  "./public/fingers/left-fingers/r.png",
  "./public/fingers/left-fingers/t.png",
  "./public/fingers/left-fingers/left-rest.png",
  "./public/fingers/right-fingers/y.png",
  "./public/fingers/right-fingers/u.png",
  "./public/fingers/right-fingers/i.png",
  "./public/fingers/right-fingers/o.png",
  "./public/fingers/right-fingers/p.png",
  "./public/fingers/left-fingers/a.png",
  "./public/fingers/left-fingers/s.png",
  "./public/fingers/left-fingers/d.png",
  "./public/fingers/left-fingers/f.png",
  "./public/fingers/left-fingers/g.png",
  "./public/fingers/right-fingers/h.png",
  "./public/fingers/right-fingers/j.png",
  "./public/fingers/right-fingers/k.png",
  "./public/fingers/right-fingers/l.png",
  "./public/fingers/left-fingers/z.png",
  "./public/fingers/left-fingers/x.png",
  "./public/fingers/left-fingers/c.png",
  "./public/fingers/left-fingers/v.png",
  "./public/fingers/left-fingers/b.png",
  "./public/fingers/right-fingers/n.png",
  "./public/fingers/right-fingers/m.png",
  "./public/fingers/right-fingers/space-right.png",
  "./public/fingers/right-fingers/semi-colon.png",
  "./public/fingers/right-fingers/singleqt.png",
  "./public/fingers/right-fingers/comma.png",
  "./public/fingers/right-fingers/period.png",
  "./public/fingers/right-fingers/qmark.png",
];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(urlsToCache);
//     })
//   );
// });

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       if (response) {
//         return response;
//       }
//       return fetch(event.request);
//     })
//   );
// });

// ✅ Install and Cache Essential Files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ✅ Fetch Event - Serve Cached Files and Cache Google Fonts
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // ✅ Ignore 'chrome-extension://' requests to avoid errors
  if (requestUrl.startsWith("chrome-extension://")) return;

  // ✅ Cache Google Fonts CSS and Font Files
  if (
    requestUrl.includes("fonts.googleapis.com") ||
    requestUrl.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(GOOGLE_FONTS_CACHE).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // ✅ Only cache successful responses
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }
            cache.put(event.request, response.clone()); // Cache the Google Fonts response
            return response;
          })
          .catch(() => caches.match(event.request)); // Serve from cache if offline
      })
    );
    return;
  }

  // ✅ Serve Cached Assets for Everything Else
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request)
          .then((response) => {
            // ✅ Only cache successful responses
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
          .catch(() => {
            // ✅ Serve Cached MP3 if Offline
            if (event.request.url.endsWith(".mp3")) {
              return caches.match("./public/windy-hill.mp3");
            }
          })
      );
    })
  );
});

// ✅ Cleanup Old Caches (on Service Worker Activation)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cache) => cache !== CACHE_NAME && cache !== GOOGLE_FONTS_CACHE
          )
          .map((cache) => caches.delete(cache))
      );
    })
  );
});
