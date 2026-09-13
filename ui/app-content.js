// Standalone content URLs enter the same app shell; embedded pages omit their header.
(() => {
  const page = location.pathname.includes('labs') ? 'labs' : 'documentation';
  if (window === window.parent) {
    location.replace('./?page=' + page + location.hash);
    return;
  }
  document.documentElement.classList.add('app-embedded');
  const style = document.createElement('style');
  style.textContent = '.app-embedded body > header { display:none!important } .app-embedded nav.toc, .app-embedded .layout > nav { top:24px }';
  document.head.appendChild(style);
  document.addEventListener('pointerdown', () => {
    parent.closeOpenAISettings();
    parent.closeWebhookSettings();
    parent.closeDemoSettings();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const file = url.pathname.split('/').pop().replace(/\.html$/, '');
    if (!['index', 'labs', 'documentation', ''].includes(file) || url.pathname === location.pathname && url.hash) return;
    event.preventDefault();
    parent.navigateApp(file === 'index' || file === '' ? 'chat' : file, url.hash);
  });
})();
