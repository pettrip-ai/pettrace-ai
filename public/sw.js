const CACHE_NAME = 'pettrace-ai-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return undefined;
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

function canCache(response) {
  return response && response.status === 200 && response.type !== 'opaque';
}

function putInCache(request, response) {
  if (!canCache(response)) return response;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => {
    cache.put(request, copy);
  });
  return response;
}

function networkFirst(request, fallbackUrl) {
  return fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        if (fallbackUrl) return caches.match(fallbackUrl);
        return undefined;
      });
    });
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => putInCache(request, response));
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/src/') || url.pathname.includes('/@vite') || url.pathname.includes('/node_modules/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'worker') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
