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
const ticketSymbol = document.querySelector('.ticketSymbol');
const ticketType = document.querySelector('.ticketType');
const tradeAmount = document.querySelector('#tradeAmount');
const buyButton = document.querySelector('#buyButton');
const positionsList = document.querySelector('#positionsList');
const marketSearch = document.querySelector('#marketSearch');
const marketFilterButtons = document.querySelectorAll('[data-market-filter]');
const positionFilterButtons = document.querySelectorAll('[data-position-filter]');
const spotEquity = document.querySelector('#spotEquity');
const perpsEquity = document.querySelector('#perpsEquity');
const portfolioPnl = document.querySelector('#portfolioPnl');

let activeMarket = marketRows[0] || null;
let activeMarketFilter = 'all';
let activePositionFilter = 'all';
let positions = [];

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

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getKindLabel(kind) {
  return kind === 'perps' ? 'Perps' : 'Spot';
}

function updateSelectedMarket(row) {
  activeMarket = row;
  const kind = row.dataset.kind || 'spot';
  if (marketTitle) marketTitle.textContent = row.dataset.symbol || 'SOL';
  if (marketSubtitle) marketSubtitle.textContent = row.dataset.sub || 'Buy with SOL · Spot';
  if (marketPrice) marketPrice.textContent = row.dataset.price || '$172.84';
  if (marketChange) marketChange.textContent = row.dataset.change || '+10.14 / +6.23%';
  if (chartTitle) chartTitle.textContent = row.dataset.chartTitle || 'SOL / USDT';
  if (chartLink && row.dataset.tvUrl) chartLink.href = row.dataset.tvUrl;
  if (chartFrame && row.dataset.chartSymbol) {
    chartFrame.title = `${row.dataset.chartTitle || row.dataset.symbol} live chart`;
    chartFrame.src = buildTradingViewUrl(row.dataset.chartSymbol);
  }
  if (ticketSymbol) ticketSymbol.textContent = row.dataset.symbol || 'SOL';
  if (ticketType) ticketType.textContent = getKindLabel(kind);
  if (buyButton) buyButton.textContent = kind === 'perps' ? 'Open Perp' : 'Buy Spot';
}

function applyMarketFilter() {
  const query = (marketSearch?.value || '').trim().toLowerCase();
  marketRows.forEach(row => {
    const kind = row.dataset.kind || 'spot';
    const symbol = (row.dataset.symbol || '').toLowerCase();
    const text = row.textContent.toLowerCase();
    const matchesKind = activeMarketFilter === 'all' || kind === activeMarketFilter;
    const matchesSearch = !query || symbol.includes(query) || text.includes(query);
    row.hidden = !(matchesKind && matchesSearch);
  });
}

function renderPositions() {
  if (!positionsList) return;
  const visible = positions.filter(position => activePositionFilter === 'all' || position.kind === activePositionFilter);
  if (!visible.length) {
    positionsList.innerHTML = '<div class="emptyState"><span>No open positions</span><button type="button" data-view="markets">Choose market</button></div>';
    positionsList.querySelector('[data-view="markets"]')?.addEventListener('click', () => openView('markets'));
  } else {
    positionsList.innerHTML = visible.map(position => {
      const current = position.entry * (1 + position.changePercent / 100);
      const pnl = (current - position.entry) * position.amount;
      const pnlPercent = position.changePercent;
      const downClass = pnl < 0 ? ' down' : '';
      return `<article class="positionRow" data-position-id="${position.id}">
        <div>
          <h3>${position.symbol}<span class="kindPill">${position.kind === 'perps' ? 'Perps' : 'Spot'}</span></h3>
          <p>${position.amount.toFixed(2)} SOL input · Entry ${formatUsd(position.entry)} · Now ${formatUsd(current)}</p>
        </div>
        <div class="positionPnl">
          <strong class="${downClass.trim()}">${formatUsd(pnl)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)</strong>
          <button type="button" data-close-position="${position.id}">Close</button>
        </div>
      </article>`;
    }).join('');
    positionsList.querySelectorAll('[data-close-position]').forEach(button => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.closePosition);
        positions = positions.filter(position => position.id !== id);
        renderPositions();
        updatePortfolio();
      });
    });
  }
  updatePortfolio();
}

function updatePortfolio() {
  let spot = 0;
  let perps = 0;
  let totalPnl = 0;
  positions.forEach(position => {
    const current = position.entry * (1 + position.changePercent / 100);
    const value = current * position.amount;
    const pnl = (current - position.entry) * position.amount;
    totalPnl += pnl;
    if (position.kind === 'perps') perps += value;
    else spot += value;
  });
  if (spotEquity) spotEquity.textContent = formatUsd(spot);
  if (perpsEquity) perpsEquity.textContent = formatUsd(perps);
  if (portfolioPnl) portfolioPnl.textContent = formatUsd(totalPnl);
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
    updateSelectedMarket(row);
    openView('trade');
  });
});

marketFilterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeMarketFilter = button.dataset.marketFilter || 'all';
    marketFilterButtons.forEach(item => item.classList.toggle('active', item === button));
    applyMarketFilter();
  });
});

positionFilterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activePositionFilter = button.dataset.positionFilter || 'all';
    positionFilterButtons.forEach(item => item.classList.toggle('active', item === button));
    renderPositions();
  });
});

if (marketSearch) marketSearch.addEventListener('input', applyMarketFilter);

if (buyButton) {
  buyButton.addEventListener('click', () => {
    if (!activeMarket) return;
    const amount = Math.max(Number(tradeAmount?.value || 1), 0.01);
    positions.unshift({
      id: Date.now(),
      symbol: activeMarket.dataset.symbol || 'SOL',
      kind: activeMarket.dataset.kind || 'spot',
      entry: Number(activeMarket.dataset.priceValue || 1),
      changePercent: Number(activeMarket.dataset.changePercent || 0),
      amount
    });
    renderPositions();
  });
}

if (activeMarket) updateSelectedMarket(activeMarket);
applyMarketFilter();
renderPositions();

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
});