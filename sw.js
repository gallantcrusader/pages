// Service worker: keeps the app, safety guides and looked-up ZIP data available offline.
// App files are network-first (fresh when online, cached when the signal drops);
// ZIP data chunks are cache-first because they never change between releases.

const VERSION = 'stormcheck-v2';
const APP_FILES = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/config.js',
  './js/guides.js',
  './js/providers.js',
  './js/sources.js',
  './js/state.js',
  './js/states.js',
  './js/track.js',
  './js/ui.js',
  './js/util.js',
  './js/zip.js',
  './js/views/home.js',
  './js/views/live.js',
  './js/views/safety.js',
  './js/views/services.js',
  './js/views/track.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './data/zip/index.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function networkFirst(request) {
  const fallback = (cache) =>
    cache.match(request, { ignoreSearch: true }).then((c) => c || (request.mode === 'navigate' ? cache.match('./index.html') : undefined));
  return caches.open(VERSION).then((cache) => {
    const network = fetch(request).then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    });
    // On a slow storm-time connection, fall back to the cached copy after 4 seconds.
    const timeout = new Promise((resolve) => setTimeout(resolve, 4000)).then(() => fallback(cache));
    return Promise.race([network.catch(() => null), timeout]).then(
      (res) => res || network.catch(() => fallback(cache).then((c) => c || Response.error())),
    );
  });
}

function cacheFirst(request) {
  return caches.open(VERSION).then((cache) =>
    cache.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }),
    ),
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // live feeds go straight to the network
  if (url.searchParams.has('ping')) return; // connection checks must hit the network
  if (url.pathname.includes('/data/zip/')) {
    event.respondWith(cacheFirst(req));
    return;
  }
  event.respondWith(networkFirst(req));
});
