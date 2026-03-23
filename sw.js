const CACHE_NAME = 'falcoes-v1';
const assets = [
  './',
  './index.html',
  './app.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
