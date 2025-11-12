// Service Worker for Fiora PWA
// Enhanced caching strategies for better offline support

const CACHE_VERSION = 'fiora-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/static/css/main.css',
    '/static/js/main.js',
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;
const MAX_API_CACHE_SIZE = 30;

// Cache size management
const limitCacheSize = (cacheName: string, maxSize: number) => {
    caches.open(cacheName).then((cache) => {
        cache.keys().then((keys) => {
            if (keys.length > maxSize) {
                cache.delete(keys[0]).then(() => {
                    limitCacheSize(cacheName, maxSize);
                });
            }
        });
    });
};

// Install event - cache static assets
self.addEventListener('install', (event: any) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => {
                console.error('[Service Worker] Failed to cache static assets:', err);
            }),
    );
    // Activate immediately
    (self as any).skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('fiora-') && !name.includes(CACHE_VERSION))
                    .map((name) => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    }),
            );
        }),
    );
    // Take control immediately
    return (self as any).clients.claim();
});

// Fetch event - different caching strategies
self.addEventListener('fetch', (event: any) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip WebSocket connections
    if (url.protocol === 'ws:' || url.protocol === 'wss:') {
        return;
    }

    // API requests - Network First strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response
                    const responseClone = response.clone();
                    
                    caches.open(API_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                        limitCacheSize(API_CACHE, MAX_API_CACHE_SIZE);
                    });

                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline page if available
                        return caches.match('/offline.html');
                    });
                }),
        );
        return;
    }

    // Image requests - Cache First strategy
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    const responseClone = response.clone();
                    
                    caches.open(IMAGE_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                        limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
                    });

                    return response;
                });
            }),
        );
        return;
    }

    // Static assets - Cache First strategy
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    const responseClone = response.clone();
                    
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });

                    return response;
                });
            }),
        );
        return;
    }

    // HTML pages - Network First with cache fallback
    if (request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                        limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
                    });

                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        return caches.match('/index.html');
                    });
                }),
        );
        return;
    }

    // Default - Network First
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    const responseClone = response.clone();
                    
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                        limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
                    });
                }

                return response;
            })
            .catch(() => {
                return caches.match(request);
            }),
    );
});

// Background sync for offline messages
self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(
            // Sync offline messages
            console.log('[Service Worker] Syncing messages...'),
        );
    }
});

// Push notifications
self.addEventListener('push', (event: any) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Fiora';
    const options = {
        body: data.body || 'You have a new message',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: data.tag || 'default',
        data: data.data || {},
    };

    event.waitUntil(
        (self as any).registration.showNotification(title, options),
    );
});

// Notification click
self.addEventListener('notificationclick', (event: any) => {
    event.notification.close();

    event.waitUntil(
        (self as any).clients.openWindow(event.notification.data.url || '/'),
    );
});

export {};
