// Çevrimdışı çalışma için servis çalışanı.
// Güncelleme yaparken CACHE değerini artırın (ör. terkin-v2); eski önbellek otomatik silinir.
const CACHE = "terkin-v2";
const DOSYALAR = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "jszip.min.js",
  "vergi-daireleri.js",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== CACHE).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

// Önce ağ: internet varken her zaman güncel dosya gelir ve önbellek yenilenir;
// internet yoksa önbellekteki kopya kullanılır. Google Fonts da aynı şekilde saklanır.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fontMu = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fontMu) return;

  e.respondWith(
    fetch(req)
      .then(yanit => {
        if (yanit.ok || yanit.type === "opaque") {
          const kopya = yanit.clone();
          caches.open(CACHE).then(c => c.put(req, kopya));
        }
        return yanit;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(k => k || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))
      )
  );
});
