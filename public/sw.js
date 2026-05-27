self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// A simple fetch listener to satisfy PWA install requirements.
self.addEventListener('fetch', (event) => {
  // Pass through all requests to the network.
  // We're not caching everything because it's a dynamic AI chat app.
  event.respondWith(
    fetch(event.request).catch(() => {
      // Return a basic fallback if offline (optional)
      return new Response('Aplicativo offline. Conecte-se à internet para usar o Mentor Musical.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});
