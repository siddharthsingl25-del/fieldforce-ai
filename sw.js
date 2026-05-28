const cacheName = "fieldforce-ai-v1";
const filesToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./mobile.html",
  "./mobile.css",
  "./mobile.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)));
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
