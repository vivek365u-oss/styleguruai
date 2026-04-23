self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10863697
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

// ══════════════════════════════════════════════════════════════════════
// STYLEGURU AI — PWA SERVICE WORKER v2.0
// Handles: Caching, Push Notifications, Deep Linking, Scheduled Alerts
// ══════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'styleguru-pwa-cache-v2';

// ── Install ───────────────────────────────────────────────────────────
self.addEventListener('install', () => {
    self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => clients.claim())
    );
});

// ── Fetch (Network-First for navigation) ─────────────────────────────
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
    }
});

// ══════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// Receives push events from the browser and displays rich notifications
// ══════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: 'StyleGuru AI', body: event.data?.text() || 'New update!' };
    }

    const title = data.title || 'StyleGuru AI ✨';
    const options = {
        body: data.body || 'Your daily style brief is ready!',
        icon: '/logo.png',
        badge: '/icons/icon-192x192.png',
        tag: data.tag || 'styleguru-general',        // Prevents duplicate notifications
        renotify: data.renotify || false,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        data: {
            url: data.url || '/',
            type: data.type || 'general',
        },
        actions: data.actions || []
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click → Deep Link ───────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app already open, focus it and navigate
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NAVIGATE', url: targetUrl });
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// ══════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER
// App sends messages to SW to schedule local notifications
// ══════════════════════════════════════════════════════════════════════

// Store for pending timers (keyed by type)
const pendingTimers = {};

self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    // ── Schedule a notification at a specific time ─────────────────
    if (type === 'SCHEDULE_NOTIFICATION') {
        const { id, delayMs, title, body, url, tag, requireInteraction } = payload;

        // Cancel any existing timer of this type
        if (pendingTimers[id]) {
            clearTimeout(pendingTimers[id]);
        }

        if (delayMs <= 0) return; // Don't schedule past events

        pendingTimers[id] = setTimeout(() => {
            self.registration.showNotification(title, {
                body,
                icon: '/logo.png',
                badge: '/icons/icon-192x192.png',
                tag: tag || id,
                requireInteraction: requireInteraction || false,
                data: { url: url || '/' },
            });
            delete pendingTimers[id];
        }, Math.min(delayMs, 2147483647)); // Max safe setTimeout value
    }

    // ── Cancel a scheduled notification ───────────────────────────
    if (type === 'CANCEL_NOTIFICATION') {
        const { id } = payload;
        if (pendingTimers[id]) {
            clearTimeout(pendingTimers[id]);
            delete pendingTimers[id];
        }
    }

    // ── Cancel ALL scheduled notifications ────────────────────────
    if (type === 'CANCEL_ALL') {
        Object.keys(pendingTimers).forEach(id => clearTimeout(pendingTimers[id]));
        Object.keys(pendingTimers).forEach(id => delete pendingTimers[id]);
    }
});
