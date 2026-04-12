self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10863697
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

// ══════════════════════════════════════════════════════════════════════
// STYLEGURU AI - PROGRESSIVE WEB APP (PWA) CORE
// ══════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'styleguru-pwa-cache-v1';

// Install event - quickly takeover
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch event MUST be present for Chrome to trigger PWA Install Prompts.
// We use a basic network-first strategy for navigation requests to ensure
// the app can at least show something or maintain the PWA illusion offline.
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails (offline), try to serve the cached index.html
                return caches.match('/index.html');
            })
        );
    }
});
