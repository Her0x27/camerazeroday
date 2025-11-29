// Camera ZeroDay Service Worker
// This service worker is only active in production mode

const CACHE_NAME = 'zeroday-cache-v1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Check if request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
    (request.method === 'GET' && 
     request.headers.get('accept') && 
     request.headers.get('accept').includes('text/html'));
}

// Fetch event - network first with SPA fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests and dev server requests
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || 
      request.url.includes('hot-update') ||
      request.url.includes('ws://') ||
      request.url.includes('wss://')) {
    return;
  }

  // Handle navigation requests (SPA routing)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached index.html for offline navigation
          return caches.match('/');
        })
    );
    return;
  }

  // Handle other requests (assets, etc.)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone();
        
        // Cache successful responses for static assets
        if (response.status === 200 && 
            (url.pathname.endsWith('.js') || 
             url.pathname.endsWith('.css') ||
             url.pathname.endsWith('.png') ||
             url.pathname.endsWith('.jpg') ||
             url.pathname.endsWith('.svg') ||
             url.pathname.endsWith('.woff2'))) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(request);
      })
  );
});
