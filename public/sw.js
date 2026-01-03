const CACHE_NAME = 'queueless-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and internal Vite/HMR requests during development
    if (event.request.method !== 'GET' ||
        event.request.url.includes('/@vite/') ||
        event.request.url.includes('/@react-refresh') ||
        event.request.url.includes('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Return null if network fetch fails (dev server might be down or disconnected)
                return null;
            });
        })
    );
});
