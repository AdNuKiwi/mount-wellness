/* Mount Wellness — build 20260822-095531 */
const CACHE = 'mount-wellness-20260822-095531';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // GitHub Pages sends Cache-Control: max-age=600, and a plain fetch() inside a
  // service worker STILL goes through the browser's HTTP cache. So "network first"
  // was quietly serving a ten-minute-old page and then storing that in the cache,
  // which is why refreshing did not pick up a new week. Force a real network trip for
  // the page itself. Icons are content-stable, so they can come from cache.
  const isPage = e.request.mode === 'navigate'
              || e.request.destination === 'document'
              || e.request.url.endsWith('.html');

  // Note: fetch by URL rather than new Request(e.request, ...) — constructing a
  // Request from one whose mode is 'navigate' throws.
  const hit = isPage ? fetch(e.request.url, { cache: 'reload' }) : fetch(e.request);

  e.respondWith(
    hit.then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
