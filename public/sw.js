// MeshPay PWA Service Worker & Background Sync Engine
const CACHE_NAME = 'meshpay-v1-pwa';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

// 1. Install & Cache Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Fallback gracefully if some assets fail
      });
    })
  );
});

// 2. Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Handler with Network First, Cache Fallback strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// 4. Background Sync Reconciliation Handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'meshpay-offline-sync' || event.tag === 'sync-reconciliation') {
    event.waitUntil(
      notifyClientsToSync()
    );
  }
});

// Helper: Notify all open or backgrounded app clients to perform store & forward reconciliation
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({
      type: 'MESHPAY_BACKGROUND_SYNC_REQUEST',
      timestamp: Date.now()
    });
  }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC_CHECK') {
    notifyClientsToSync();
  }
});
