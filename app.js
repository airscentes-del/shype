const body = document.body;
const menuButton = document.querySelector('.menuButton');
const drawerOverlay = document.querySelector('[data-close-drawer]');
const viewButtons = document.querySelectorAll('[data-view]');
const panels = document.querySelectorAll('[data-panel]');
const drawerLinks = document.querySelectorAll('.drawerLink[data-view]');
const mobileNavItems = document.querySelectorAll('.mobileNavItem[data-view]');
const marketRows = document.querySelectorAll('.marketRow[data-symbol]');
const marketTitle = document.querySelector('.marketIdentity strong');
const marketSubtitle = document.querySelector('.marketIdentity small');
const marketPrice = document.querySelector('.marketNumbers strong');
const marketChange = document.querySelector('.marketNumbers span');
const chartTitle = document.querySelector('.chartTopline strong');
const chartLink = document.querySelector('.chartTopline a');
const chartFrame = document.querySelector('.chartFrame iframe');

function closeDrawer() {
  body.classList.remove('drawerOpen');
  if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
}

function openView(view) {
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === view);
  });

  drawerLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  mobileNavItems.forEach(item => {
    const target = item.dataset.view;
    item.classList.toggle('active', target === view || (view === 'portfolio' && target === 'account'));
  });

  closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildTradingViewUrl(symbol) {
  return `https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=60&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=1&save_image=0&studies=[]&locale=en#%7B%22page-uri%22%3A%22shype.app%2Fapp.html%22%7D`;
}

if (menuButton) {
  menuButton.addEventListener('click', () => {
    const isOpen = body.classList.toggle('drawerOpen');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

viewButtons.forEach(button => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (view) openView(view);
  });
});

marketRows.forEach(row => {
  row.addEventListener('click', () => {
    if (marketTitle) marketTitle.textContent = row.dataset.symbol || 'SOL-PERP';
    if (marketSubtitle) marketSubtitle.textContent = row.dataset.sub || 'Solana perpetual · Jupiter route';
    if (marketPrice) marketPrice.textContent = row.dataset.price || '$172.84';
    if (marketChange) marketChange.textContent = row.dataset.change || '+10.14 / +6.23%';
    if (chartTitle) chartTitle.textContent = row.dataset.chartTitle || 'SOL / USDT';
    if (chartLink && row.dataset.tvUrl) chartLink.href = row.dataset.tvUrl;
    if (chartFrame && row.dataset.chartSymbol) {
      chartFrame.title = `${row.dataset.chartTitle || row.dataset.symbol} live chart`;
      chartFrame.src = buildTradingViewUrl(row.dataset.chartSymbol);
    }
    openView('trade');
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
});