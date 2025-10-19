// A version number is used to bust the cache when you deploy new updates.
const CACHE_NAME = 'yahtzee-scorekeeper-v1.6';

// A list of files to cache for offline use.
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  // Pre-cache all the files needed for the app to work offline.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Do not call skipWaiting() here, as we want to prompt the user to update.
});

// The activate event is fired when the service worker becomes active.
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  // This is the ideal place to clean up old caches.
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

// The fetch event is fired for every network request.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For our own assets, we implement a cache-first strategy.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        // If the resource is in the cache, serve it from there.
        if (response) {
          return response;
        }
        // If not, fetch it from the network, cache it, and then return it.
        return fetch(event.request).then((networkResponse) => {
          // We don't cache Firebase or D3 scripts, only our own files.
          if (event.request.url.includes('firebase') || event.request.url.includes('d3')) {
              return networkResponse;
          }
          // Cache the new resource and return it.
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// Listen for a message from the main app to skip the waiting phase.
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});


