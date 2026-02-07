/*
 *  ════════════════════════════════════════════════════════════════════════════
 *  SPDX-License-Identifier: Apache-2.0
 *  Copyright (c) 2025 TNG-Blue
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *  ════════════════════════════════════════════════════════════════════════════
 */

/* =============================================================================
 * Service Worker for Isaac ROS Jetbot NanoOWL Documentation
 * Offline support and caching strategies
 * ============================================================================= */

const CACHE_NAME = 'jetbot-nanoowl-v1.0.1';
const RUNTIME_CACHE = 'jetbot-runtime';

// Get the base path dynamically
const getBasePath = () => {
  const path = self.location.pathname;
  const match = path.match(/.*\//);
  return match ? match[0] : '/';
};

const BASE_PATH = getBasePath();

// Resources to cache immediately
const PRE_CACHE_URLS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'getting-started/',
  BASE_PATH + 'documentation/',
  BASE_PATH + 'stylesheets/extra.css',
  BASE_PATH + 'stylesheets/animations.css',
  BASE_PATH + 'stylesheets/premium.css',
  BASE_PATH + 'javascripts/extra.js',
  BASE_PATH + 'javascripts/premium.js',
  BASE_PATH + 'manifest.json',
].filter(url => url); // Remove any empty URLs

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
              return caches.match(BASE_PATH + 'offline.html').then(response => {
                return response || new Response(
                  '<h1>You are offline</h1><p>Please check your internet connection.</p>',
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                      'Content-Type': 'text/html'
                    })
                  }
                );
              });
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
    icon: BASE_PATH + 'images/icon-192x192.png',
    badge: BASE_PATH + 'images/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: BASE_PATH + 'images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: BASE_PATH + 'images/xmark.png'
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
      clients.openWindow(BASE_PATH)
    );
  }
});

console.log('Service Worker: Loaded');
