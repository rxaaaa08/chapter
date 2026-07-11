self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// Pass-through fetch handler — but ONLY for same-origin requests.
// Cross-origin requests (Cloudinary images, Vimeo player, Google Fonts, etc.)
// bypass the SW entirely and use the browser's normal fetch path. Otherwise
// the SW's fetch(e.request) treats cross-origin <img>/<link> requests as
// no-cors, which under a strict CSP fails opaquely with the generic error
// "FetchEvent.respondWith received an error: TypeError: Load failed".
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip everything not on our own origin — let the browser handle it
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request));
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let payload = { title: 'chapter அ', body: 'You have a new reply', url: '/', tag: 'chat-reply' };
  try { payload = { ...payload, ...e.data.json() }; } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/apple-touch-icon.png',
      tag: payload.tag,
      renotify: true,
      data: { url: payload.url },
    })
  );
});

// FCM (Android/Chrome) occasionally rotates or invalidates push subscriptions;
// Apple's don't. Re-subscribe immediately with the same key so the endpoint
// stays live. The new endpoint can't be saved to the DB from here (no auth in
// the SW) — the admin panel re-saves it the next time it's opened.
self.addEventListener('pushsubscriptionchange', e => {
  const key = e.oldSubscription && e.oldSubscription.options && e.oldSubscription.options.applicationServerKey;
  if (!key) return;
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Find an existing PWA window and navigate it to the target URL
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Navigate to the target URL (e.g. /admin?tab=chats)
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      // No existing window — open a new one
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
