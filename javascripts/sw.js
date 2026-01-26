/* =============================================================================
 * Service Worker for Isaac ROS Jetbot NanoOWL Documentation
 * Offline support and caching strategies
 * ============================================================================= */

const CACHE_NAME = 'jetbot-nanoowl-v1.0.0';
const RUNTIME_CACHE = 'jetbot-runtime';

// Resources to cache immediately
const PRE_CACHE_URLS = [
  '/Isaac_ROS-Jetbot_NanoOWL/',
  '/Isaac_ROS-Jetbot_NanoOWL/index.html',
  '/Isaac_ROS-Jetbot_NanoOWL/getting-started/',
  '/Isaac_ROS-Jetbot_NanoOWL/documentation/',
  '/Isaac_ROS-Jetbot_NanoOWL/stylesheets/extra.css',
  '/Isaac_ROS-Jetbot_NanoOWL/stylesheets/animations.css',
  '/Isaac_ROS-Jetbot_NanoOWL/stylesheets/premium.css',
  '/Isaac_ROS-Jetbot_NanoOWL/javascripts/extra.js',
  '/Isaac_ROS-Jetbot_NanoOWL/javascripts/premium.js',
  '/Isaac_ROS-Jetbot_NanoOWL/manifest.json',
];

/* ===========================================================================
 * Install Event - Pre-cache critical resources
 * =========================================================================== */
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(PRE_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

/* ===========================================================================
 * Activate Event - Clean up old caches
 * =========================================================================== */
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
            .map(cacheName => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ===========================================================================
 * Fetch Event - Caching strategy: Network First, fallback to Cache
 * =========================================================================== */
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          // Update cache in background
          event.waitUntil(updateCache(event.request));
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response (can only be consumed once)
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/Isaac_ROS-Jetbot_NanoOWL/offline.html');
            }
          });
      })
  );
});

/* ===========================================================================
 * Helper: Update Cache in Background
 * =========================================================================== */
function updateCache(request) {
  return fetch(request)
    .then(response => {
      if (!response || response.status !== 200) {
        return;
      }

      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => {
          cache.put(request, responseToCache);
        });
    })
    .catch(() => {
      // Silently fail - user is offline
    });
}

/* ===========================================================================
 * Message Event - Handle messages from clients
 * =========================================================================== */
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
    );
  }
});

/* ===========================================================================
 * Background Sync - Sync data when back online
 * =========================================================================== */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  // Implement your sync logic here
  console.log('Service Worker: Syncing data...');
  return Promise.resolve();
}

/* ===========================================================================
 * Push Notifications
 * =========================================================================== */
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/Isaac_ROS-Jetbot_NanoOWL/images/icon-192x192.png',
    badge: '/Isaac_ROS-Jetbot_NanoOWL/images/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: '/Isaac_ROS-Jetbot_NanoOWL/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/Isaac_ROS-Jetbot_NanoOWL/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Isaac ROS Jetbot NanoOWL', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/Isaac_ROS-Jetbot_NanoOWL/')
    );
  }
});

console.log('Service Worker: Loaded');
