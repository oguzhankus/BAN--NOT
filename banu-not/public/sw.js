const CACHE_NAME = 'banu-not-shell-v1';
const OFFLINE_URL = '/offline';
const OFFLINE_NAVIGATION_PATHS = new Set([
  '/',
  '/kesfet',
  '/dersler',
  '/nasil-calisir',
  '/hakkimizda',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL, '/favicon.ico', '/icon.svg']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('banu-not-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && OFFLINE_NAVIGATION_PATHS.has(url.pathname)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(new Request(`${url.origin}${url.pathname}`), response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cachedPage = OFFLINE_NAVIGATION_PATHS.has(url.pathname)
            ? await cache.match(new Request(`${url.origin}${url.pathname}`))
            : undefined;
          return cachedPage || await cache.match(OFFLINE_URL) || Response.error();
        }
      })(),
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || '' };
  }

  const title = typeof payload.title === 'string' ? payload.title : 'BANÜ NOT';
  const body = typeof payload.body === 'string' ? payload.body : 'Yeni bir bildirimin var.';
  const url = typeof payload.url === 'string' ? payload.url : '/bildirimler';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/bildirimler', self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
        if (existing) {
          return existing.navigate(target.href).then(() => existing.focus());
        }
        return self.clients.openWindow(target.href);
      }),
  );
});
