const CACHE_NAME = 'mch-v2';

const APP_SHELL = ['/', '/index.html', '/logo.svg', '/manifest.json'];

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

// ── Activate : nettoie les anciens caches ──────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;

  // API, auth, socket.io → réseau direct, jamais de cache
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/socket.io/')
  ) return;

  // Assets Vite (noms hachés) → cache-first immutable
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // Uploads (avatars, photos) → stale-while-revalidate
  if (url.pathname.startsWith('/uploads/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => {
          const network = fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Navigation SPA → network-first, fallback index.html pour offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/index.html').then((r) => r || caches.match('/'))
      )
    );
    return;
  }

  // Tout le reste → cache-first avec mise à jour réseau en fond
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          try {
            caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
          } catch (_) {}
        }
        return res;
      });
    })
  );
});
