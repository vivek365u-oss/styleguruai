importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDDW9fSoKxoLlH3MJSRNAuD3c-Qnak7rSw",
  authDomain: "tonefit-44fc2.firebaseapp.com",
  projectId: "tonefit-44fc2",
  storageBucket: "tonefit-44fc2.firebasestorage.app",
  messagingSenderId: "382677564269",
  appId: "1:382677564269:web:d8bf5abd28dd7f544db864"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'StyleGuru AI ✨';
  const notificationOptions = {
    body: payload.notification?.body || 'Aapke liye ek naya style update hai!',
    icon: '/logo.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ══════════════════════════════════════════════════════════════════════
// STYLEGURU AI — PWA SERVICE WORKER v3.0
// Clean rewrite — 3rd party ad script removed
// Handles: Caching, Push Notifications, Deep Linking, Scheduled Alerts
// ══════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'styleguru-pwa-cache-v3';

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
        tag: data.tag || 'styleguru-general',
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
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NAVIGATE', url: targetUrl });
                    return;
                }
            }
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

const pendingTimers = {};

self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    if (type === 'SCHEDULE_NOTIFICATION') {
        const { id, delayMs, title, body, url, tag, requireInteraction } = payload;
        if (pendingTimers[id]) clearTimeout(pendingTimers[id]);
        if (delayMs <= 0) return;
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
        }, Math.min(delayMs, 2147483647));
    }

    if (type === 'CANCEL_NOTIFICATION') {
        const { id } = payload;
        if (pendingTimers[id]) {
            clearTimeout(pendingTimers[id]);
            delete pendingTimers[id];
        }
    }

    if (type === 'CANCEL_ALL') {
        Object.keys(pendingTimers).forEach(id => clearTimeout(pendingTimers[id]));
        Object.keys(pendingTimers).forEach(id => delete pendingTimers[id]);
    }
});
