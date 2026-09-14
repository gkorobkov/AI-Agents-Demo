// Keep chat DOM and in-flight requests alive while reading the exercises.
(() => {
  const pages = { labs: 'labs.html', documentation: 'documentation.html' };
  const frame = document.createElement('iframe');
  frame.id = 'app-content';
  frame.hidden = true;
  frame.title = 'Лабораторные работы';
  document.querySelector('header').after(frame);
  const syncFrameTheme = () => {
    if (frame.contentDocument) frame.contentDocument.documentElement.dataset.theme = document.documentElement.dataset.theme;
  };
  frame.addEventListener('load', syncFrameTheme);
  new MutationObserver(syncFrameTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.navigateApp = (requestedPage, hash = '', push = true) => {
    const page = Object.hasOwn(pages, requestedPage) ? requestedPage : 'chat';
    closeDrawer();
    closeOpenAISettings(true);
    closeWebhookSettings(true);
    closeDemoSettings(true);
    document.body.dataset.appPage = page;
    document.querySelectorAll('[data-app-page]').forEach(link => {
      if (link === document.body) return;
      if (link.dataset.appPage === page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.getElementById('app-nav-documentation').hidden = page !== 'documentation';
    frame.hidden = page === 'chat';
    if (!frame.hidden) {
      frame.title = page === 'labs' ? 'Лабораторные работы' : 'Документация';
      const src = pages[page] + '?embedded=1' + hash;
      if (frame.getAttribute('src') !== src) frame.src = src;
    }
    const url = new URL(location.href);
    if (page === 'chat') url.searchParams.delete('page');
    else url.searchParams.set('page', page);
    url.hash = hash;
    if (push) history.pushState({ page }, '', url);
    document.title = page === 'chat' ? 'AI Agent Chat' : frame.title + ' — AI Agent';
    syncSettingsDock();
    document.dispatchEvent(new Event('app:pagechange'));
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const file = url.pathname.split('/').pop().replace(/\.html$/, '');
    const page = link.dataset.appPage || (file === 'labs' ? 'labs' : file === 'documentation' ? 'documentation' : null);
    if (!page) return;
    event.preventDefault();
    navigateApp(page, url.hash);
  });
  window.addEventListener('popstate', () => navigateApp(new URL(location.href).searchParams.get('page'), location.hash, false));
  navigateApp(new URL(location.href).searchParams.get('page'), location.hash, false);
})();
