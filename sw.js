const CACHE = 'sopracciglia-v196';
/* IMMAGINI (sprite, sfondi): una cache che resta tra una versione e l'altra. Si prendono subito dalla memoria del telefono
   e si aggiornano in silenzio dalla rete una volta per sessione (così gli sfondi compaiono subito, anche con rete lenta). */
const MEDIA = 'sopracciglia-immagini';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== MEDIA).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const aggiornati = new Set();   /* immagini già ricontrollate in questa sessione */
function aggiornaImmagine(key) {
  if (aggiornati.has(key)) return Promise.resolve();
  aggiornati.add(key);
  return fetch(key, { cache: 'no-cache' }).then(res => {
    if (res && res.ok) return caches.open(MEDIA).then(c => c.put(key, res));
  }).catch(() => {});
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* immagini del gioco: prima la memoria, poi (in silenzio) la rete. La musica no: il telefono la chiede a pezzi. */
  if (url.origin === location.origin && /\.(png|webp|jpg|jpeg)$/i.test(url.pathname)) {
    const key = url.origin + url.pathname;   /* senza ?r=… dei tentativi ripetuti */
    e.respondWith(
      caches.open(MEDIA).then(c => c.match(key)).then(hit => {
        if (hit) { e.waitUntil(aggiornaImmagine(key)); return hit; }
        aggiornati.add(key);
        return fetch(e.request).then(res => {
          if (res && res.ok) { const copy = res.clone(); e.waitUntil(caches.open(MEDIA).then(c => c.put(key, copy))); }
          return res;
        });
      }).catch(() => fetch(e.request))
    );
    return;
  }
  /* tutto il resto: rete prima (così gli aggiornamenti arrivano subito), cache solo se offline */
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || Response.error()))
  );
});
