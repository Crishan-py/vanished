/* ==================================================================
   VANISHED — service worker
   ------------------------------------------------------------------
   Precaches the app shell so the map and your entries still open with
   no connection. Map tiles are handled separately, below — caching
   OpenStreetMap tiles in bulk would be rude to their free infrastructure.
   ================================================================== */

const VERSION = 'vanished-v2';
const TILES  = 'vanished-tiles-v1';

const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './places.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll is all-or-nothing; one 404 would leave you with no cache at all
      .then((cache) => Promise.all(
        SHELL.map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION && k !== TILES)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Map tiles: cache-first, but keep the cache small. Someone opening this
  // offline in their own city should still see streets they have browsed.
  const isTile = url.hostname.endsWith('tile.openstreetmap.org') ||
                 url.pathname.endsWith('.png');

  if (isTile){
    event.respondWith(
      caches.open(TILES).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e){
          // offline and unseen: a transparent tile beats a broken map
          return new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  // Leaflet from CDN: cache-first, it is versioned by URL already.
  if (url.hostname === 'unpkg.com'){
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok){
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // App shell: network-first so you get updates, cache as the fallback.
  if (url.origin === self.location.origin){
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok){
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit ||
          caches.match('./index.html')))
    );
  }
});