const CACHE_NAME = "kumo-v1"
self.addEventListener("install", (event) => {
  self.skipWaiting()
})
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  )
  self.clients.claim()
})
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => new Response("<h1>Offline</h1><p>Connect to continue using Kumo.</p>", { headers: { "Content-Type": "text/html" } })))
  }
})
