const CACHE = 'sopracciglia-v251';
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
    ).then(() => self.clients.claim()).then(rinfrescaImmagini)
  );
});

/* NUOVA VERSIONE: ricontrolla tutte le immagini in memoria. Quelle sostituite (stesso nome, contenuto nuovo) vengono
   riscaricate, quelle eliminate dal gioco vengono tolte dalla memoria del telefono. Le immagini uguali costano pochissimo
   (il server risponde solo "non è cambiata"). */
function rinfrescaImmagini() {
  return caches.open(MEDIA).then(c => c.keys().then(reqs => {
    const coda = reqs.map(r => r.url);
    const lavora = () => {
      const key = coda.shift();
      if (!key) return Promise.resolve();
      aggiornati.add(key);
      return fetch(key, { cache: 'no-cache' }).then(res => {
        if (res.ok) return c.put(key, res);
        if (res.status === 404 || res.status === 410) return c.delete(key);
      }).catch(() => {}).then(lavora);
    };
    return Promise.all([1, 2, 3, 4, 5, 6].map(lavora));   /* 6 alla volta */
  }));
}

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
