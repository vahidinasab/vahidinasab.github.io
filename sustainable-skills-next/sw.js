/* Makes the tool work offline and open quickly on a return visit.

   - The app's own files are saved on the device the first time it opens.
   - A page is fetched from the network first, so a new version shows straight away when there is a connection.
   - Other files (scripts, data, pictures, fonts) are shown from the saved copy at once and refreshed in the
     background once per visit, so a change you publish appears the next time the tool is opened.
     No version number to bump.
   - The PDF maker, the teacher pack and the job and subject pages are saved later, one file at a time, only
     after the page asks, so saving them never competes with what the person is looking at.
   - It only handles this site's own files. It never touches the visit counter or any other site. */
var CACHE = 'sles-roadmap-1';
var CORE = ['./', 'manifest.webmanifest', 'data/guide.js', 'data/subjects.js', 'data/jobs.js', 'data/home.js', 'js/core.js', 'js/app.js',
  'fonts/archivo-latin-800-normal.woff2', 'fonts/ibm-plex-sans-latin-400-normal.woff2', 'fonts/ibm-plex-sans-latin-600-normal.woff2', 'fonts/ibm-plex-sans-latin-700-normal.woff2',
  'images/home-scene-800.jpg', 'images/home-scene-night-800.jpg', 'images/home-moving.svg', 'assets/uos-logo.png', 'assets/uos-logo-white.png', 'assets/icon-192.png', 'assets/logo.svg', 'assets/qr.svg'];
var LATER = ['js/pdf.js', 'vendor/pdf-lib-1.17.1.min.js', 'assets/pages.css', 'teachers.html', 'slides.html', 'worksheet.html', 'poster.html', 'privacy.html', 'accessibility.html', 'jobs/', 'subjects/'];
var SCOPE = new URL(self.registration.scope).pathname;

function put(cache, url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (r.ok) return cache.put(url, r); }).catch(function () { /* try again another time */ }); }
function pause(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return put(c, u); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('sles-roadmap-') === 0; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});

// "save-rest" arrives from the page a little while after it has loaded. Everything else is then saved one file at a
// time, skipping what is already saved. Nothing extra is fetched on a phone set to save data or on a very slow line.
var saving = false;
function saveRest() {
  return caches.open(CACHE).then(function (c) {
    return fetch('sitemap.xml', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; }).then(function (xml) {
      var list = LATER.slice(), base = '/sustainable-skills/', re = /<loc>https?:\/\/[^\/]+(\/[^<]*)<\/loc>/g, m;
      // Every page listed in sitemap.xml (the job and subject pages), so they open offline too.
      while ((m = re.exec(xml))) {
        var rel = m[1].indexOf(base) === 0 ? m[1].slice(base.length) : null;
        if (rel && /\.html$/.test(rel) && list.indexOf(rel) === -1) list.push(rel);
      }
      return list.reduce(function (chain, rel) {
        return chain.then(function () { return c.match(SCOPE + rel); }).then(function (hit) { if (!hit) return put(c, SCOPE + rel).then(function () { return pause(300); }); });
      }, Promise.resolve());
    });
  });
}
self.addEventListener('message', function (e) {
  if (e.data !== 'save-rest' || saving) return;
  var conn = self.navigator && self.navigator.connection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
  saving = true;
  var done = function () { saving = false; };
  e.waitUntil(saveRest().then(done, done));
});

function notSaved() {
  return new Response('<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Not saved on this device yet</title></head>' +
    '<body><h1>This page is not saved on this device yet</h1><p>Connect to the internet to open it, or go back to <a href="' + SCOPE + '">the roadmap</a>, which works without a connection.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

var refreshed = {};   // each saved file is refreshed once each time this worker starts, not on every request
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.indexOf(SCOPE) !== 0) return;
  if (req.mode === 'navigate') {
    // Pages: the network first, the saved copy if there is no connection (or it takes more than four seconds).
    e.respondWith(caches.open(CACHE).then(function (c) {
      var isApp = url.pathname === SCOPE || url.pathname === SCOPE + 'index.html';
      var saved = function () { return c.match(req, { ignoreSearch: true }).then(function (r) { return r || (isApp ? c.match('./') : undefined); }); };
      var net = fetch(req).then(function (r) { if (r.ok) c.put(url.pathname, r.clone()); return r; });
      var orSaved = net.catch(function () { return saved().then(function (r) { return r || notSaved(); }); });
      var slow = pause(4000).then(saved).then(function (r) { return r || orSaved; });
      return Promise.race([orSaved, slow]);
    }));
    return;
  }
  // Everything else: the saved copy at once. Not saved yet: the network (and the browser's own cache), then save it.
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        if (!refreshed[url.pathname]) {
          refreshed[url.pathname] = true;
          e.waitUntil(fetch(url.pathname, { cache: 'no-cache' }).then(function (r) { if (r.ok) return c.put(url.pathname, r); }).catch(function () { delete refreshed[url.pathname]; }));
        }
        return hit;
      }
      return fetch(req).then(function (r) { if (r.ok) { refreshed[url.pathname] = true; c.put(url.pathname, r.clone()); } return r; }).catch(function (err) {
        // With no connection and no saved copy of the large picture, the smaller saved picture stands in.
        var small = url.pathname.replace(/-1344\.jpg$/, '-800.jpg');
        return small === url.pathname ? Promise.reject(err) : c.match(small).then(function (r) { return r || Promise.reject(err); });
      });
    });
  }));
});
