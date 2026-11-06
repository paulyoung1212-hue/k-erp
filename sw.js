// Minimal service worker so the page can be installed to the home screen.
// It does not cache anything: data always comes live from Firestore.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
