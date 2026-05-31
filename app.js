const body = document.body;
const menuToggle = document.querySelector('.menuToggle');
const closeTargets = document.querySelectorAll('[data-close-menu]');
const viewButtons = document.querySelectorAll('[data-view]');
const panels = document.querySelectorAll('[data-panel]');
const drawerItems = document.querySelectorAll('.drawerItem[data-view]');
const bottomItems = document.querySelectorAll('.bottomItem[data-view]');
const pairButtons = document.querySelectorAll('.marketRow[data-pair]');

function closeMenu() {
  body.classList.remove('menuOpen');
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
}

function openView(view) {
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === view);
  });

  drawerItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  bottomItems.forEach(item => {
    const target = item.dataset.view;
    item.classList.toggle('active', target === view || (view === 'portfolio' && target === 'account'));
  });

  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const open = body.classList.toggle('menuOpen');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}

closeTargets.forEach(target => target.addEventListener('click', closeMenu));

viewButtons.forEach(button => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (view) openView(view);
  });
});

pairButtons.forEach(row => {
  row.addEventListener('click', () => {
    const pair = row.dataset.pair || 'SHYPE-USDC';
    const pairName = document.querySelector('.pairButton strong');
    if (pairName) pairName.textContent = pair;
    openView('trade');
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});