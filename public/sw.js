/**
 * Tradosphere Wealth Management (TWM) Service Worker
 * Conservative Offline & Caching Strategy for Financial Services
 *
 * SAFETY RULES:
 * 1. NEVER cache authenticated API requests (/api/*)
 * 2. NEVER cache KYC documents, vault files, or private customer records
 * 3. NEVER cache admin or employee confidential payloads
 * 4. Only cache immutable static assets (JS chunks, CSS, fonts, app icons, manifest)
 * 5. Provide offline fallback navigation page when network connectivity fails
 */

const CACHE_NAME = 'twm-static-v1';

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// Installation event: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[TWM SW] Non-critical precache failure:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NON-GET requests are ALWAYS network-only
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. SENSITIVE PATHS: All API endpoints, document downloads, admin/employee private endpoints
  // MUST NEVER be served from cache or cached. Network only.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/documents/') ||
    url.pathname.startsWith('/uploads/') ||
    url.searchParams.has('token')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Connection required. Financial data unavailable offline.',
            offline: true,
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        );
      })
    );
    return;
  }

  // 3. STATIC ASSETS: JS chunks, CSS, fonts, images from _next/static or /icons/
  // Cache-First strategy with network fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/favicon.svg'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. NAVIGATION REQUESTS (HTML Pages):
  // Network-First strategy. If network fails, serve /offline fallback page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedFallback = await caches.match('/offline');
        if (cachedFallback) {
          return cachedFallback;
        }
        return new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline | Tradosphere Wealth Management</title>
  <style>
    body { background-color: #0B111E; color: #F1F5F9; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #131C2E; border: 1px solid #1E293B; border-radius: 16px; padding: 32px 24px; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { font-size: 1.25rem; margin-bottom: 8px; font-weight: 700; color: #FFF; }
    p { font-size: 0.875rem; color: #94A3B8; line-height: 1.5; margin-bottom: 24px; }
    button { background: #2563EB; color: #FFF; border: none; border-radius: 10px; padding: 10px 20px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #1D4ED8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connection Required</h1>
    <p>You are currently offline. An active internet connection is required to securely access financial services and data.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`,
          {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          }
        );
      })
    );
    return;
  }

  // 5. Default: Network only
  event.respondWith(fetch(event.request));
});
