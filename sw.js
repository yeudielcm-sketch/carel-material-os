/**
 * Reporte de OS — trabajador de servicio.
 *
 * No está aquí para hacer magia sin señal: está porque sin él el teléfono no
 * ofrece «instalar la aplicación», y de paso guarda lo pesado —el lector de
 * códigos son 328 KB— para que no se baje dos veces.
 *
 * La regla que importa: la página SIEMPRE se pide a la red primero. Si se
 * sirviera de la caché, el día que se corrija algo el técnico seguiría con la
 * versión vieja sin enterarse. La copia guardada es solo el paracaídas de
 * cuando no hay señal.
 *
 * Lo que se guarda con el guardado (Apps Script) no se toca: son datos, y una
 * respuesta vieja de ahí sería peor que un error.
 */
var CACHE = "carel-os-v1";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icono-192.png",
  "./icono-512.png",
  "./icono-maskable-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // addAll falla entero si un recurso falla; aquí se acepta lo que se pueda.
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // el guardado y las fuentes, de largo

  var esPagina = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);

  if (esPagina) {
    e.respondWith(
      fetch(req).then(function (r) {
        var copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // Lo demás del propio sitio —lector, iconos— cambia poco: se sirve de la
  // caché y se refresca por detrás para la próxima vez.
  e.respondWith(
    caches.match(req).then(function (guardado) {
      var red = fetch(req).then(function (r) {
        if (r && r.status === 200) {
          var copia = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return r;
      }).catch(function () { return guardado; });
      return guardado || red;
    })
  );
});
