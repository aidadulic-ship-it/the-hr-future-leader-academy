// Service Worker der HR Future Thinkers Academy.
// Ziel: App-Hülle und Lerninhalte offline lesbar machen. Konto- und Schreibzugriffe bleiben immer beim Server.
const CACHE = 'academy-v1';
const SHELL = ['/', '/app.css', '/app.js', '/manifest.webmanifest', '/api/content',
  '/assets/icons/icon-192.png', '/assets/icons/icon-512.png', '/assets/icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(n => n.startsWith('academy-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

const remember = async (request, response) => {
  if (response.ok) await (await caches.open(CACHE)).put(request, response.clone());
  return response;
};
const networkFirst = async (request, fallback = request) => {
  try { return await remember(request, await fetch(request)); }
  catch (error) { const hit = await caches.match(fallback); if (hit) return hit; throw error; }
};
const cacheFirst = async request => (await caches.match(request)) || remember(request, await fetch(request));

self.addEventListener('fetch', event => {
  const { request } = event; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/content') return;
  if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request));
  else if (request.mode === 'navigate') event.respondWith(networkFirst(request, '/'));
  else event.respondWith(networkFirst(request));
});
