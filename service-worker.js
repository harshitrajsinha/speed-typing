const CACHE_NAME = "speedtyping-cache-v1";
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
