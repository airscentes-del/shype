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
const tradeTicket = document.querySelector('.tradeTicket');
const positionsList = document.querySelector('#positionsList');
const marketSearch = document.querySelector('#marketSearch');
const marketFilterButtons = document.querySelectorAll('[data-market-filter]');
const positionFilterButtons = document.querySelectorAll('[data-position-filter]');
const terminalTabButtons = document.querySelectorAll('.terminalTabs button');
const chartModule = document.querySelector('.chartModule');
const marketHeader = document.querySelector('.marketHeader');
const spotEquity = document.querySelector('#spotEquity');
const perpsEquity = document.querySelector('#perpsEquity');
const portfolioPnl = document.querySelector('#portfolioPnl');
const toast = document.querySelector('#toast');
const emptyMarketState = document.querySelector('#emptyMarketState');

const liveStyle = document.createElement('style');
liveStyle.textContent = `
  .marketTableHead,.marketRow{grid-template-columns:28px minmax(0,1fr) 95px 94px!important;gap:3px!important}
  .starButton{width:22px!important;height:38px!important;font-size:18px!important;margin-left:3px!important;margin-right:-3px!important;transform:translateX(4px) scale(.96);font-family:"Arial Rounded MT Bold","SF Pro Rounded",ui-rounded,system-ui,sans-serif!important;font-weight:600!important;opacity:.9!important}
  .starButton.active{opacity:1!important}
  .marketHeader{grid-template-columns:minmax(0,1fr) auto 44px!important}
  .metricToggle{width:36px;height:36px;border:1px solid var(--line-strong);border-radius:10px;background:rgba(255,255,255,.025);display:grid;place-items:center;color:var(--soft);font-size:18px;cursor:pointer}
  .metricToggle.open{color:var(--blue);border-color:rgba(69,201,255,.42);background:rgba(69,201,255,.08)}
  .marketDetailsPanel{display:none;grid-template-columns:1fr 1fr;gap:18px;padding:14px 18px 15px;background:#091923;border-bottom:1px solid var(--line-strong)}
  .marketDetailsPanel.open{display:grid}
  .marketDetail span{display:block;color:var(--muted);font-size:12px;line-height:1.2;margin-bottom:5px;text-decoration:underline dotted rgba(149,169,180,.55);text-underline-offset:4px}
  .marketDetail strong{font-size:15px;font-weight:430;color:var(--text)}
  .marketDetail strong.accent{color:var(--blue)}
  .terminalLivePanel{display:none;min-height:390px;background:#071722;border-bottom:1px solid var(--line-strong)}
  .terminalLivePanel.active{display:block}
  .bookToolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid var(--line);color:var(--soft);font-size:13px}
  .bookToolbar button,.bookToolbar select{border:0;background:transparent;color:var(--soft);font:inherit}
  .orderBookGrid{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:10px 0 12px;min-height:345px;position:relative;overflow:hidden}
  .orderBookSide{display:grid;grid-auto-rows:22px;align-content:start}
  .orderBookHeader,.bookLevel{display:grid;grid-template-columns:1fr 1fr;padding:0 14px;gap:8px;align-items:center}
  .orderBookHeader{color:var(--muted);font-size:12px;margin-bottom:5px}
  .bookLevel{position:relative;font-size:15px;color:var(--soft);font-variant-numeric:tabular-nums}
  .bookLevel span{position:relative;z-index:1}
  .bookLevel .priceBid{color:#23b997}.bookLevel .priceAsk{color:var(--red)}
  .bookLevel .bar{position:absolute;inset:2px 0 2px auto;border-radius:0;background:rgba(35,185,151,.16)}
  .asks .bookLevel .bar{left:0;right:auto;background:rgba(255,129,158,.16)}
  .bookMid{position:absolute;left:50%;top:36px;bottom:12px;width:1px;background:var(--line-strong)}
  .tradesTable{padding:10px 0 12px;min-height:390px}
  .tradeLine,.tradesHead{display:grid;grid-template-columns:1fr 1fr 1fr 22px;align-items:center;gap:8px;padding:0 18px;min-height:24px;font-variant-numeric:tabular-nums}
  .tradesHead{color:var(--muted);font-size:12px;margin-bottom:4px}
  .tradeLine{font-size:15px;color:var(--soft)}
  .tradeLine .buy{color:#23b997}.tradeLine .sell{color:var(--red)}.tradeLine a{color:var(--blue);font-size:16px;text-align:right}
  .infoPanel{padding:18px;min-height:390px}
  .infoCard{border:1px solid var(--line-strong);border-radius:16px;background:rgba(255,255,255,.018);overflow:hidden}
  .infoCard h3{font-size:20px;font-weight:520;margin:0;padding:16px 16px 10px}
  .infoRow{display:flex;justify-content:space-between;gap:18px;padding:13px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
  .infoRow strong{color:var(--text);font-weight:430;text-align:right}.infoRow .accent{color:var(--blue)}
  @media(max-width:760px){.marketTableHead,.marketRow{grid-template-columns:28px minmax(0,1fr) 86px 90px!important}.starButton{transform:translateX(5px) scale(.94)}.marketDetailsPanel{grid-template-columns:1fr 1fr;padding-inline:16px}.terminalLivePanel{min-height:360px}}
  @media(max-width:420px){.marketTableHead,.marketRow{grid-template-columns:27px minmax(0,1fr) 78px 78px!important}.starButton{width:21px!important;font-size:17px!important;transform:translateX(5px) scale(.93)}.marketHeader{grid-template-columns:minmax(0,1fr) auto 38px!important}.metricToggle{width:34px;height:34px}.orderBookHeader,.bookLevel{padding:0 12px}.tradeLine,.tradesHead{padding-inline:14px;grid-template-columns:1fr 1fr 1fr 18px}}
`;
document.head.appendChild(liveStyle);

let activeMarket = Array.from(marketRows).find(row => row.dataset.kind === 'perps' && row.dataset.symbol === 'SOL-USDC') || marketRows[0] || null;
let activeMarketFilter = 'all';
let activePositionFilter = 'all';
let activeTerminalTab = 'chart';
let positions = [];
let walletConnected = localStorage.getItem('shypeWalletConnected') === 'true';
let favorites = new Set(JSON.parse(localStorage.getItem('shypeFavorites') || '[]'));
let toastTimer;
let liveTimer;
const basePrices = new Map();
const livePrices = new Map();

marketRows.forEach(row => {
  const symbol = row.dataset.symbol;
  const base = Number(row.dataset.priceValue || 1);
  basePrices.set(symbol, base);
  livePrices.set(symbol, base);
});

function closeDrawer() {
  body.classList.remove('drawerOpen');
  if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function setWalletConnected(value) {
  walletConnected = value;
  localStorage.setItem('shypeWalletConnected', String(value));
  document.querySelectorAll('.connectWallet').forEach(button => {
    button.textContent = value ? 'Connected' : 'Connect';
    button.classList.toggle('connected', value);
  });
  document.querySelector('.walletStatusText')?.replaceChildren(document.createTextNode(value ? 'Demo wallet connected.' : 'No wallet connected.'));
  updateFavoriteStars();
  applyMarketFilter();
}

function openView(view) {
  panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === view));
  drawerLinks.forEach(link => link.classList.toggle('active', link.dataset.view === view));
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

function formatMarketNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  if (number >= 1000) return number.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  if (number >= 1) return number.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return number.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}

function getBaseAsset(symbol) {
  return (symbol || 'SOL').split(/[/-]/)[0];
}

function getKindLabel(kind, badge) {
  if (kind === 'perps') return `Perps · ${badge || '10x'}`;
  return 'Spot';
}

function getCurrentPrice(symbol) {
  return livePrices.get(symbol) || Number(activeMarket?.dataset.priceValue || 1);
}

function percentFromBase(row) {
  const symbol = row?.dataset.symbol;
  const base = basePrices.get(symbol) || Number(row?.dataset.priceValue || 1);
  const current = getCurrentPrice(symbol);
  if (!base) return 0;
  return ((current - base) / base) * 100;
}

function updateSelectedMarket(row) {
  activeMarket = row;
  const kind = row.dataset.kind || 'spot';
  const badge = row.dataset.badge || row.dataset.sub || '';
  const symbol = row.dataset.symbol || 'SOL/USDC';
  const current = getCurrentPrice(symbol);
  const pct = percentFromBase(row);
  if (marketTitle) marketTitle.textContent = symbol;
  if (marketSubtitle) marketSubtitle.textContent = kind === 'perps' ? badge : 'SPOT';
  if (marketPrice) marketPrice.textContent = formatMarketNumber(current);
  if (marketChange) marketChange.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  if (chartTitle) chartTitle.textContent = row.dataset.chartTitle || `${getBaseAsset(symbol)} / USDT`;
  if (chartLink && row.dataset.tvUrl) chartLink.href = row.dataset.tvUrl;
  if (chartFrame && row.dataset.chartSymbol) {
    chartFrame.title = `${row.dataset.chartTitle || symbol} live chart`;
    chartFrame.src = buildTradingViewUrl(row.dataset.chartSymbol);
  }
  if (ticketSymbol) ticketSymbol.textContent = symbol;
  if (ticketType) ticketType.textContent = getKindLabel(kind, badge);
  if (buyButton) buyButton.textContent = kind === 'perps' ? 'Open Perp' : 'Buy Spot';
  renderLiveModules();
}

function updateFavoriteStars() {
  marketRows.forEach(row => {
    const star = row.querySelector('.starButton');
    if (!star) return;
    const isFavorite = favorites.has(row.dataset.symbol);
    star.classList.toggle('active', isFavorite);
    star.textContent = isFavorite ? '★' : '☆';
  });
}

function saveFavorites() {
  localStorage.setItem('shypeFavorites', JSON.stringify([...favorites]));
}

function applyMarketFilter() {
  const query = (marketSearch?.value || '').trim().toLowerCase();
  let visibleCount = 0;
  marketRows.forEach(row => {
    const kind = row.dataset.kind || 'spot';
    const symbol = (row.dataset.symbol || '').toLowerCase();
    const text = row.textContent.toLowerCase();
    const matchesKind = activeMarketFilter === 'all' || kind === activeMarketFilter || (activeMarketFilter === 'favorites' && favorites.has(row.dataset.symbol));
    const matchesSearch = !query || symbol.includes(query) || text.includes(query);
    const shouldShow = matchesKind && matchesSearch;
    row.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });
  if (emptyMarketState) {
    emptyMarketState.classList.toggle('visible', visibleCount === 0);
    emptyMarketState.textContent = activeMarketFilter === 'favorites'
      ? (walletConnected ? 'No favorites yet. Tap a star to save markets.' : 'Connect wallet to save and view favorites.')
      : 'No markets match your search.';
  }
}

function createLivePanels() {
  if (!marketHeader || document.querySelector('.metricToggle')) return;
  const metricToggle = document.createElement('button');
  metricToggle.className = 'metricToggle';
  metricToggle.type = 'button';
  metricToggle.setAttribute('aria-label', 'Toggle market details');
  metricToggle.textContent = '⌄';
  marketHeader.append(metricToggle);
  const details = document.createElement('section');
  details.className = 'marketDetailsPanel';
  details.innerHTML = '<div class="marketDetail"><span>Mark / Oracle</span><strong id="detailMark">--</strong></div><div class="marketDetail"><span>24h Volume</span><strong id="detailVolume">--</strong></div><div class="marketDetail"><span>Open Interest</span><strong id="detailOi">--</strong></div><div class="marketDetail"><span>Funding / Countdown</span><strong class="accent" id="detailFunding">--</strong></div>';
  marketHeader.after(details);
  metricToggle.addEventListener('click', () => {
    const open = details.classList.toggle('open');
    metricToggle.classList.toggle('open', open);
    metricToggle.textContent = open ? '⌃' : '⌄';
  });
  if (!chartModule) return;
  const panelsWrap = document.createElement('section');
  panelsWrap.className = 'terminalPanels';
  panelsWrap.innerHTML = '<section class="terminalLivePanel orderBookPanel" data-terminal-panel="orderbook"></section><section class="terminalLivePanel tradesPanel" data-terminal-panel="trades"></section><section class="terminalLivePanel infoPanel" data-terminal-panel="info"></section>';
  chartModule.after(panelsWrap);
}

function setTerminalTab(tab) {
  activeTerminalTab = tab;
  terminalTabButtons.forEach(button => button.classList.toggle('active', button.dataset.terminalTab === tab));
  if (chartModule) chartModule.style.display = tab === 'chart' ? '' : 'none';
  if (tradeTicket) tradeTicket.style.display = tab === 'chart' ? '' : 'none';
  document.querySelectorAll('[data-terminal-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.terminalPanel === tab));
  renderLiveModules();
}

function setupTerminalTabs() {
  terminalTabButtons.forEach(button => {
    const label = button.textContent.trim().toLowerCase().replace(/\s+/g, '');
    const tab = label === 'orderbook' ? 'orderbook' : label;
    button.dataset.terminalTab = tab;
    button.addEventListener('click', () => setTerminalTab(tab));
  });
}

function renderOrderBook() {
  const panel = document.querySelector('[data-terminal-panel="orderbook"]');
  if (!panel || !activeMarket) return;
  const symbol = activeMarket.dataset.symbol || 'SOL-USDC';
  const base = getBaseAsset(symbol);
  const mid = getCurrentPrice(symbol);
  const depth = activeMarket.dataset.kind === 'perps' ? 15 : 9;
  const bids = [];
  const asks = [];
  for (let i = depth; i >= 1; i -= 1) {
    bids.push({ price: mid * (1 - i * 0.00012), total: Math.abs(Math.sin(i * 1.7 + mid)) * 14 + i * 0.7 + 0.4 });
  }
  for (let i = 1; i <= depth; i += 1) {
    asks.push({ price: mid * (1 + i * 0.00012), total: Math.abs(Math.cos(i * 1.45 + mid)) * 13 + i * 0.65 + 0.4 });
  }
  const maxTotal = Math.max(...bids.map(level => level.total), ...asks.map(level => level.total), 1);
  const rowHtml = (level, side) => `<div class="bookLevel"><i class="bar" style="width:${Math.max(8, (level.total / maxTotal) * 96)}%"></i><span class="${side === 'bid' ? 'priceBid' : 'priceAsk'}">${formatMarketNumber(level.price)}</span><span>${level.total.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span></div>`;
  panel.innerHTML = `<div class="bookToolbar"><button type="button">1⌄</button><span>${base} order book</span><select aria-label="Quote asset"><option>${base}</option></select></div><div class="orderBookGrid"><div class="bookMid"></div><div class="orderBookSide bids"><div class="orderBookHeader"><span>Price</span><span>Total (${base})</span></div>${bids.map(level => rowHtml(level, 'bid')).join('')}</div><div class="orderBookSide asks"><div class="orderBookHeader"><span>Price</span><span>Total (${base})</span></div>${asks.map(level => rowHtml(level, 'ask')).join('')}</div></div>`;
}

function renderTrades() {
  const panel = document.querySelector('[data-terminal-panel="trades"]');
  if (!panel || !activeMarket) return;
  const symbol = activeMarket.dataset.symbol || 'SOL-USDC';
  const base = getBaseAsset(symbol);
  const mid = getCurrentPrice(symbol);
  const rows = Array.from({ length: 18 }, (_, i) => {
    const side = Math.sin(Date.now() / 1000 + i) > 0 ? 'buy' : 'sell';
    const price = mid * (1 + (Math.random() - 0.5) * 0.0012);
    const size = (Math.abs(Math.cos(i + mid)) * 0.012 + 0.00012) * (mid > 1000 ? 1 : 10);
    const date = new Date(Date.now() - i * 2600);
    const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<div class="tradeLine"><span class="${side}">${formatMarketNumber(price)}</span><span>${size.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span><span>${time}</span><a href="#" aria-label="Open transaction">↗</a></div>`;
  }).join('');
  panel.innerHTML = `<div class="tradesTable"><div class="tradesHead"><span>Price</span><span>Size (${base})</span><span>Time</span><span></span></div>${rows}</div>`;
}

function renderInfo() {
  const panel = document.querySelector('[data-terminal-panel="info"]');
  if (!panel || !activeMarket) return;
  const symbol = activeMarket.dataset.symbol || 'SOL-USDC';
  const kind = activeMarket.dataset.kind || 'spot';
  const base = getBaseAsset(symbol);
  const price = getCurrentPrice(symbol);
  const volume = activeMarket.querySelector('.marketVolume')?.textContent || '--';
  const badge = activeMarket.dataset.badge || (kind === 'perps' ? '10x' : 'SPOT');
  const route = kind === 'perps' ? 'Jupiter Perps route' : 'Jupiter spot route from SOL';
  const next = new Date(Date.now() + 56 * 60 * 1000);
  panel.innerHTML = `<div class="infoCard"><h3>${symbol}</h3><div class="infoRow"><span>Market type</span><strong class="accent">${kind === 'perps' ? 'Perpetual' : 'Spot'}</strong></div><div class="infoRow"><span>Base asset</span><strong>${base}</strong></div><div class="infoRow"><span>Quote / collateral</span><strong>${kind === 'perps' ? 'USDC' : 'SOL route / USDC pool'}</strong></div><div class="infoRow"><span>Last price</span><strong>${formatMarketNumber(price)}</strong></div><div class="infoRow"><span>24h volume</span><strong>${volume}</strong></div><div class="infoRow"><span>Max leverage</span><strong>${kind === 'perps' ? badge : 'None'}</strong></div><div class="infoRow"><span>Route</span><strong>${route}</strong></div><div class="infoRow"><span>Metadata source</span><strong>SHYPE market config</strong></div><div class="infoRow"><span>Next refresh</span><strong>${next.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</strong></div></div>`;
}

function renderDetailsPanel() {
  if (!activeMarket) return;
  const symbol = activeMarket.dataset.symbol || 'SOL-USDC';
  const kind = activeMarket.dataset.kind || 'spot';
  const price = getCurrentPrice(symbol);
  const oracle = price * (1 + 0.00018);
  const volume = activeMarket.querySelector('.marketVolume')?.textContent || '--';
  const oi = kind === 'perps' ? `$${(price * 30300).toLocaleString('de-DE', { maximumFractionDigits: 0 })}` : '--';
  const funding = kind === 'perps' ? '0,0013%   00:56:45' : 'Spot market';
  document.querySelector('#detailMark')?.replaceChildren(document.createTextNode(`${formatMarketNumber(price)} / ${formatMarketNumber(oracle)}`));
  document.querySelector('#detailVolume')?.replaceChildren(document.createTextNode(volume));
  document.querySelector('#detailOi')?.replaceChildren(document.createTextNode(oi));
  document.querySelector('#detailFunding')?.replaceChildren(document.createTextNode(funding));
}

function renderLiveModules() {
  renderDetailsPanel();
  if (activeTerminalTab === 'orderbook') renderOrderBook();
  if (activeTerminalTab === 'trades') renderTrades();
  if (activeTerminalTab === 'info') renderInfo();
}

function updateLivePrices() {
  marketRows.forEach(row => {
    const symbol = row.dataset.symbol;
    const current = livePrices.get(symbol) || Number(row.dataset.priceValue || 1);
    const volatility = current > 1000 ? 0.0007 : current > 10 ? 0.0012 : 0.00025;
    const next = Math.max(0.00001, current * (1 + (Math.random() - 0.48) * volatility));
    livePrices.set(symbol, next);
    const priceNode = row.querySelector('.marketLast strong');
    const changeNode = row.querySelector('.marketLast em');
    const pct = percentFromBase(row);
    if (priceNode) priceNode.textContent = formatMarketNumber(next);
    if (changeNode) {
      changeNode.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      changeNode.classList.toggle('down', pct < 0);
    }
  });
  if (activeMarket) {
    const current = getCurrentPrice(activeMarket.dataset.symbol);
    const pct = percentFromBase(activeMarket);
    if (marketPrice) marketPrice.textContent = formatMarketNumber(current);
    if (marketChange) marketChange.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  }
  renderLiveModules();
  renderPositions();
  updatePortfolio();
}

function renderPositions() {
  if (!positionsList) return;
  const visible = positions.filter(position => activePositionFilter === 'all' || position.kind === activePositionFilter);
  if (!visible.length) {
    positionsList.innerHTML = '<div class="emptyState"><span>No open positions</span><button type="button" data-view="markets">Choose market</button></div>';
    positionsList.querySelector('[data-view="markets"]')?.addEventListener('click', () => openView('markets'));
  } else {
    positionsList.innerHTML = visible.map(position => {
      const current = livePrices.get(position.symbol) || position.entry;
      const pnl = (current - position.entry) * position.amount;
      const pnlPercent = ((current - position.entry) / position.entry) * 100;
      const downClass = pnl < 0 ? ' down' : '';
      return `<article class="positionRow" data-position-id="${position.id}"><div><h3>${position.symbol}<span class="kindPill">${position.kind === 'perps' ? 'Perps' : 'Spot'}</span></h3><p>${position.amount.toFixed(2)} SOL input · Entry ${formatUsd(position.entry)} · Now ${formatUsd(current)}</p></div><div class="positionPnl"><strong class="${downClass.trim()}">${formatUsd(pnl)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)</strong><button type="button" data-close-position="${position.id}">Close</button></div></article>`;
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
    const current = livePrices.get(position.symbol) || position.entry;
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

document.querySelectorAll('.connectWallet, .accountSheet .primaryWide').forEach(button => {
  button.addEventListener('click', () => {
    setWalletConnected(true);
    showToast('Demo wallet connected. Favorites are now enabled.');
  });
});

viewButtons.forEach(button => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (view) openView(view);
  });
});

marketRows.forEach(row => {
  row.querySelector('.marketMain')?.addEventListener('click', () => {
    updateSelectedMarket(row);
    setTerminalTab('chart');
    openView('trade');
  });
  row.querySelector('.starButton')?.addEventListener('click', event => {
    event.stopPropagation();
    if (!walletConnected) {
      showToast('Connect wallet to save favorites.');
      return;
    }
    const symbol = row.dataset.symbol;
    if (favorites.has(symbol)) favorites.delete(symbol);
    else favorites.add(symbol);
    saveFavorites();
    updateFavoriteStars();
    applyMarketFilter();
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
    const symbol = activeMarket.dataset.symbol || 'SOL/USDC';
    positions.unshift({ id: Date.now(), symbol, kind: activeMarket.dataset.kind || 'spot', entry: getCurrentPrice(symbol), amount });
    renderPositions();
  });
}

createLivePanels();
setupTerminalTabs();
setWalletConnected(walletConnected);
updateFavoriteStars();
if (activeMarket) updateSelectedMarket(activeMarket);
applyMarketFilter();
setTerminalTab('chart');
renderPositions();
clearInterval(liveTimer);
liveTimer = setInterval(updateLivePrices, 2200);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
});