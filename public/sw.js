const CACHE_NAME = 'queueless-v2'; // Incrementing version to force update
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the new SW to become active immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Immediately take control of the page
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and internal Vite/HMR/Ext requests
    if (event.request.method !== 'GET' ||
        event.request.url.includes('/@vite/') ||
        event.request.url.includes('/@react-refresh') ||
        event.request.url.includes('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // If the response is valid and not an error, we can optionally cache new assets here
                // For now, just return it. 
                // If it's a 404 returning index.html, the fallback below might triggered or fetch returns it.
                return response;
            }).catch(() => {
                // Return nothing or a specific offline page if needed
                return null;
            });
        })
    );
});
