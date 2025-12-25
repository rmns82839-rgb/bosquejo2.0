const CACHE_NAME = 'mmm-studio-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',      // ¡Importante añadir estos!
  './script.js',     // ¡Importante añadir estos!
  './logo.png',       // Tu logo local
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Instalación: Cachear archivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos cache.addAll pero con un pequeño truco para que si un archivo falla, no rompa todo
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Toma el control de las pestañas abiertas inmediatamente
});

// Estrategia: Red primero, cae a Caché si falla (Stale-while-revalidate mejorado)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Actualizamos la caché con la nueva respuesta de la red
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay red, devolvemos lo que haya en caché
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Manejo de notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('./');
    })
  );
});
