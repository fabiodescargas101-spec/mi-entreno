// Permite usar la app sin conexión. Sube el número de versión cuando cambies archivos.
const CACHE = 'mi-entreno-v4';
const LIB = 'mi-entreno-biblioteca';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'exercises.js', 'avatar.js', 'library.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== LIB).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Biblioteca libre (fotos y lista): guardar copia para usarla sin conexión
  if (e.request.method === 'GET' && url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith('/yuhonas/free-exercise-db/')) {
    e.respondWith(caches.open(LIB).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Google/Drive siempre por red
  // Red primero (para recibir actualizaciones); si no hay conexión, caché.
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
