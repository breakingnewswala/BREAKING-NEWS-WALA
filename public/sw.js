/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Service Worker for Real-Time Push Alerts & Notification Actions
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'ब्रेकिंग न्यूज़ वाला (BNW)',
    body: 'मध्य प्रदेश की ताज़ा खबर देखें।',
    district: 'मध्य प्रदेश',
    url: '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || parsed.message || payload.body,
        district: parsed.district || payload.district,
        url: parsed.url || '/',
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: `${payload.district ? `[${payload.district}] ` : ''}${payload.body}`,
      icon: '/brand/logo.png',
      badge: '/brand/logo.png',
      tag: 'bnw-breaking-alert',
      renotify: true,
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
