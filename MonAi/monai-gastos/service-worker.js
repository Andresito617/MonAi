// Sube la versión cuando cambies archivos para forzar la actualización del caché
const VERSION = 'gastos-v4';
const FILES = ['./', './index.html', './manifest.json',
  './css/base.css', './css/components.css', './css/sheets.css',
  './js/main.js', './js/utils.js', './js/state.js', './js/parser.js', './js/ai.js', './js/voice.js',
  './js/ui/home.js', './js/ui/addSheet.js', './js/ui/settings.js', './js/ui/cash.js',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k != VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Responde desde caché y actualiza en segundo plano (las llamadas a Gemini no se tocan)
self.addEventListener('fetch', e => {
  if (e.request.method != 'GET' || new URL(e.request.url).origin != location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const red = fetch(e.request).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return r; }).catch(() => hit);
    return hit || red;
  }));
});
