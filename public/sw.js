// Service Worker for QR Code Reader PWA
// Implements offline-first caching strategies

const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `qr-reader-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `qr-reader-runtime-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon.svg',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old version caches
              return (cacheName.startsWith('qr-reader-') &&
                      cacheName !== STATIC_CACHE_NAME &&
                      cacheName !== RUNTIME_CACHE_NAME);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for CDN assets)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // For navigation requests (HTML pages), use Network First strategy
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // For static assets (JS, CSS, images), use Cache First strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For API requests, use Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Cache First Strategy
// Best for static assets that don't change often
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache first fetch failed:', error);
    // Return a fallback response if available
    return caches.match('/');
  }
}

// Network First Strategy
// Best for dynamic content that needs to be fresh
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network first - falling back to cache');
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return the main page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }

    throw error;
  }
}

// Stale While Revalidate Strategy
// Returns cached version immediately, then updates cache in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[ServiceWorker] Stale while revalidate fetch failed:', error);
      return null;
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.ports[0].postMessage(status);
    });
  }
});

// Get cache status for debugging
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.map(req => req.url);
  }

  return status;
}

console.log('[ServiceWorker] Service Worker loaded');
