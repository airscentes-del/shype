const body = document.body;
const menuButton = document.querySelector('.menuButton');
const drawerOverlay = document.querySelector('[data-close-drawer]');
const viewButtons = document.querySelectorAll('[data-view]');
const panels = document.querySelectorAll('[data-panel]');
const drawerLinks = document.querySelectorAll('.drawerLink[data-view]');
const mobileNavItems = document.querySelectorAll('.mobileNavItem[data-view]');
const marketRows = document.querySelectorAll('.marketRow[data-symbol]');

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
    const symbol = row.dataset.symbol || 'SOL-PERP';
    const marketTitle = document.querySelector('.marketIdentity strong');
    if (marketTitle) marketTitle.textContent = symbol;
    openView('trade');
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
});