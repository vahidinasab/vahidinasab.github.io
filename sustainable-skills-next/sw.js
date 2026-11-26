/* Makes the tool work offline and open quickly on a return visit.

   - The app's own files are saved on the device the first time it opens.
   - A page is fetched from the network first, so a new version shows straight away when there is a connection.
   - Other files (styles, scripts, data, pictures, fonts) are shown from the saved copy at once and refreshed in
     the background, so a change you publish appears the next time the tool is opened. No version number to bump.
   - It only handles this site's own files. It never touches the visit counter or any other site. */
var CACHE = 'sles-roadmap-1';
var CORE = ['./', 'manifest.webmanifest', 'data/guide.js', 'data/subjects.js', 'data/jobs.js', 'data/home.js', 'js/core.js', 'js/app.js',
  'fonts/archivo-latin-800-normal.woff2', 'fonts/ibm-plex-sans-latin-400-normal.woff2', 'fonts/ibm-plex-sans-latin-600-normal.woff2', 'fonts/ibm-plex-sans-latin-700-normal.woff2',
  'images/home-scene-800.jpg', 'images/home-scene-night-800.jpg', 'images/home-moving.svg', 'assets/uos-logo.png', 'assets/uos-logo-white.png', 'assets/icon-192.png'];
// Saved quietly afterwards, so PDFs and the teacher pack also work without a connection.
var LATER = ['js/pdf.js', 'vendor/pdf-lib-1.17.1.min.js', 'assets/pages.css', 'teachers.html', 'slides.html', 'worksheet.html', 'poster.html', 'privacy.html', 'accessibility.html', 'jobs/', 'subjects/'];

function put(cache, url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (r.ok) return cache.put(url, r); }).catch(function () { /* try again another time */ }); }
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(CORE.map(function (u) { return put(c, u); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('sles-roadmap-') === 0; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); })
    .then(function () {
      // On a phone set to save data, or on a very slow connection, nothing extra is fetched: pages are saved as they are opened.
      var conn = self.navigator && self.navigator.connection;
      if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;
      caches.open(CACHE).then(function (c) {
        LATER.forEach(function (u) { put(c, u); });
        // Every page listed in sitemap.xml (the job and subject pages), so they open offline too.
        fetch('sitemap.xml', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (xml) {
          var scope = new URL(self.registration.scope).pathname, base = '/sustainable-skills/', re = /<loc>https?:\/\/[^\/]+(\/[^<]*)<\/loc>/g, m;
          while ((m = re.exec(xml))) {
            var rel = m[1].indexOf(base) === 0 ? m[1].slice(base.length) : null;
            if (rel && /\.html$/.test(rel) && LATER.indexOf(rel) === -1) put(c, scope + rel);
          }
        }).catch(function () { /* another time */ });
      });
    }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return;
  if (req.mode === 'navigate') {
    // Pages: the network first, the saved copy if there is no connection (or it takes more than four seconds).
    e.respondWith(caches.open(CACHE).then(function (c) {
      var saved = function () { return c.match(req, { ignoreSearch: true }).then(function (r) { return r || c.match('./'); }); };
      var net = fetch(req).then(function (r) { if (r.ok) c.put(url.pathname, r.clone()); return r; });
      var slow = new Promise(function (res) { setTimeout(res, 4000); }).then(saved);
      return Promise.race([net.catch(function () { return saved(); }), slow.then(function (r) { return r || net; })]).then(function (r) { return r || net; });
    }));
    return;
  }
  // Everything else: the saved copy at once, refreshed in the background.
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req, { cache: 'no-cache' }).then(function (r) { if (r.ok) c.put(req, r.clone()); return r; });
      if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
      // With no connection and no saved copy of a large picture, the smaller saved picture stands in.
      return net.catch(function (err) {
        var small = url.pathname.replace(/-1344\.jpg$/, '-800.jpg');
        return small === url.pathname ? Promise.reject(err) : c.match(small).then(function (r) { return r || Promise.reject(err); });
      });
    });
  }));
});
