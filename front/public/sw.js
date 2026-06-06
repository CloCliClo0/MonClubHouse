const CACHE = 'mch-v1'
const SHELL = ['/', '/index.html', '/logo.svg', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // Ignore non-http(s) schemes (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) return

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('/').then(r => r || fetch('/')))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok && !res.bodyUsed) {
          try {
            const toCache = res.clone()
            caches.open(CACHE).then(c => c.put(e.request, toCache))
          } catch (_) {}
        }
        return res
      })
    })
  )
})
