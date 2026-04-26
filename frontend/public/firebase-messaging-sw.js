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

// Handle background messages
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

// Handle notification click from FCM background message
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if already open
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      // Or open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
