/**
 * Monta URL da API: mesmo host quando o front é servido pelo Express (:3000),
 * ou http(s)://mesmo-host:3000 quando a página veio de outra porta (ex.: Live Server).
 * Opcional: <meta name="api-origin" content="http://localhost:PORT"> em qualquer HTML.
 */
(function () {
  function inferApiOrigin() {
    const loc = window.location;
    if (loc.protocol === 'file:') return 'http://localhost:3000';
    const meta = document.querySelector('meta[name="api-origin"]');
    if (meta && meta.content.trim()) return meta.content.trim().replace(/\/$/, '');
    const port = loc.port;
    const host = loc.hostname;
    const proto = loc.protocol;
    if (port && port !== '3000') return `${proto}//${host}:3000`;
    return '';
  }

  const origin = inferApiOrigin();

  window.apiUrl = function apiUrl(path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return origin ? origin + p : p;
  };
})();
