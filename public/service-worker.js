// public/service-worker.js
const CACHE_NAME = 'goddidmart-app-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// VERY IMPORTANT: Minimal fetch handler
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Let the browser handle requests to the server during development
  if (event.request.url.includes('localhost')) {
    return;
  }
  
  // For production, only cache static assets
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
    return;
  }
  
  // For HTML/navigation requests, always fetch from network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For all other requests, don't intercept
  return;
});