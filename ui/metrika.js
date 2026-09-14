// One counter for the shell and standalone policy pages. Frames never initialize it.
(() => {
  if (window !== window.parent || window.appMetrika) return;
  const CFG_METRIKA_ID = 112561962;
  let initialized = false;
  let previousUrl = '';
  function consented() {
    try { return localStorage.getItem('n8n_consent') === '1'; } catch (_) { return false; }
  }
  function safeUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      const page = url.searchParams.get('page');
      url.username = ''; url.password = ''; url.search = ''; url.hash = '';
      if (url.origin === location.origin && ['labs', 'documentation'].includes(page)) url.searchParams.set('page', page);
      return url.href;
    } catch (_) { return ''; }
  }
  function protectContent() {
    document.querySelectorAll('#messages, #input-area, .transport-settings-panel, #connection-summary, #mobile-connection-summary, .composer-destination, #toast, #openai-tool-results').forEach(el => el.classList.add('ym-hide-content'));
    document.querySelectorAll('input, textarea').forEach(el => el.classList.add('ym-disable-keys'));
  }
  function trackPage() {
    if (!consented() || !/^https?:$/.test(location.protocol)) return;
    const url = safeUrl(location.href);
    if (url === previousUrl) return;
    if (!initialized) {
      protectContent();
      window.ym = window.ym || function() { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = Date.now();
      const src = 'https://mc.yandex.ru/metrika/tag.js?id=' + CFG_METRIKA_ID;
      if (![...document.scripts].some(script => script.src === src)) {
        const script = document.createElement('script'); script.async = true; script.src = src;
        document.head.appendChild(script);
      }
      window.ym(CFG_METRIKA_ID, 'init', {
        defer: true, webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true,
        url, referrer: safeUrl(document.referrer)
      });
      initialized = true;
    }
    window.ym(CFG_METRIKA_ID, 'hit', url, { title: document.title, referer: previousUrl || safeUrl(document.referrer) });
    previousUrl = url;
  }
  window.appMetrika = { trackPage };
  document.addEventListener('app:pagechange', trackPage);
  document.addEventListener('app:consent', trackPage);
  window.addEventListener('storage', event => {
    if (event.key !== 'n8n_consent') return;
    if (consented()) trackPage();
    else if (initialized) {
      window.ym(CFG_METRIKA_ID, 'destruct'); initialized = false; previousUrl = '';
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackPage, { once: true });
  else trackPage();
})();
