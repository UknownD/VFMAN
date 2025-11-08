// Service Worker pour PWA - Permet le fonctionnement hors ligne
const CACHE_NAME = "chiffrement-securise-v1"
const urlsToCache = ["/", "/notepad", "/settings"]

// Installation du Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache ouvert")
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Suppression ancien cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Stratégie de cache: Network First, puis Cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse avant de la mettre en cache
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return response
      })
      .catch(() => {
        // Si le réseau échoue, utilise le cache
        return caches.match(event.request)
      }),
  )
})
