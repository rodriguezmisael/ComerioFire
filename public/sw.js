const CACHE='comerio-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/offline.html','/favicon.svg','/icons/icon-192.png'])));self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||req.url.includes('/api/')||req.url.includes('/documento/'))return;if(req.mode==='navigate')event.respondWith(fetch(req).catch(()=>caches.match('/offline.html')))});
