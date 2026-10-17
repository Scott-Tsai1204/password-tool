// 離線快取：開過一次之後，沒有網路也能開啟工具。
// 有網路時會在背景更新快取，下次開啟就是新版本。
const CACHE = 'pwtool-v1';
const ASSETS = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './' : req;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => {
        if (res.ok && !res.redirected) cache.put(key, res.clone());
        return res;
      });
      if (cached) {
        e.waitUntil(fresh.catch(() => {}));
        return cached;
      }
      return fresh;
    })
  );
});
