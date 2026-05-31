(() => {
  const spotMarkets = [
    { symbol: 'BTC/SOL', quote: 'SOL', price: 899.42, volume: '$9,8 Mio.', change: '+0.22%', chart: 'BINANCE%3ABTCUSDT', title: 'BTC / USDT' },
    { symbol: 'BTC/USDT', quote: 'USDT', price: 73915, volume: '$18,4 Mio.', change: '+0.14%', chart: 'BINANCE%3ABTCUSDT', title: 'BTC / USDT' },
    { symbol: 'ETH/SOL', quote: 'SOL', price: 24.36, volume: '$4,7 Mio.', change: '-0.41%', chart: 'BINANCE%3AETHUSDT', title: 'ETH / USDT' },
    { symbol: 'ETH/USDT', quote: 'USDT', price: 2004.5, volume: '$8,2 Mio.', change: '-0.71%', chart: 'BINANCE%3AETHUSDT', title: 'ETH / USDT' },
    { symbol: 'HYPE/SOL', quote: 'SOL', price: 0.879, volume: '$7,4 Mio.', change: '+6.97%', chart: 'BITGET%3AHYPEUSDT', title: 'HYPE / USDT' },
    { symbol: 'HYPE/USDT', quote: 'USDT', price: 72.31, volume: '$12,8 Mio.', change: '+6.97%', chart: 'BITGET%3AHYPEUSDT', title: 'HYPE / USDT' },
    { symbol: 'SOL/USDT', quote: 'USDT', price: 82.24, volume: '$6,1 Mio.', change: '-0.33%', chart: 'BINANCE%3ASOLUSDT', title: 'SOL / USDT' },
    { symbol: 'JUP/SOL', quote: 'SOL', price: 0.00759, volume: '$2,9 Mio.', change: '+2.41%', chart: 'BINANCE%3AJUPUSDT', title: 'JUP / USDT' },
    { symbol: 'JUP/USDC', quote: 'USDC', price: 0.624, volume: '$5,8 Mio.', change: '+2.41%', chart: 'BINANCE%3AJUPUSDT', title: 'JUP / USDT' },
    { symbol: 'WIF/SOL', quote: 'SOL', price: 0.00948, volume: '$3,2 Mio.', change: '+4.02%', chart: 'BINANCE%3AWIFUSDT', title: 'WIF / USDT' },
    { symbol: 'WIF/USDC', quote: 'USDC', price: 0.781, volume: '$4,9 Mio.', change: '+4.02%', chart: 'BINANCE%3AWIFUSDT', title: 'WIF / USDT' }
  ];

  const state = {
    activeQuote: 'all',
    currentSymbol: '',
    positions: [],
    priceMap: new Map(),
    baseMap: new Map()
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    if (number >= 1000) return number.toLocaleString('de-DE', { maximumFractionDigits: 0 });
    if (number >= 1) return number.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    return number.toLocaleString('de-DE', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
  }

  function parsePrice(text) {
    return Number(String(text || '0').replace(/[$€\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  }

  function baseAsset(symbol) {
    return String(symbol || 'SOL').split(/[/-]/)[0];
  }

  function quoteAsset(symbol) {
    return String(symbol || '').split(/[/-]/)[1] || 'USDC';
  }

  function kindFromRow(row) {
    return row?.dataset.kind || (String(row?.dataset.symbol || '').includes('-') ? 'perps' : 'spot');
  }

  function selectedRow() {
    const symbol = $('.marketIdentity strong')?.textContent?.trim();
    return $(`.marketRow[data-symbol="${CSS.escape(symbol || '')}"]`) || $('.marketRow');
  }

  function tradingViewUrl(symbol) {
    return `https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=60&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=1&save_image=0&studies=[]&locale=en#%7B%22page-uri%22%3A%22shype.app%2Fapp.html%22%7D`;
  }

  function addQuoteTabs() {
    if ($('.quoteTabs')) return;
    const modeTabs = $('.marketModeTabs');
    if (!modeTabs) return;
    const nav = document.createElement('nav');
    nav.className = 'quoteTabs';
    nav.setAttribute('aria-label', 'Spot quote filter');
    nav.innerHTML = `
      <button class="active" type="button" data-quote-filter="all">All</button>
      <button type="button" data-quote-filter="USDC">USDC</button>
      <button type="button" data-quote-filter="SOL">SOL</button>
      <button type="button" data-quote-filter="USDT">USDT</button>
    `;
    modeTabs.after(nav);
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-quote-filter]');
      if (!button) return;
      state.activeQuote = button.dataset.quoteFilter || 'all';
      $$('.quoteTabs button').forEach(item => item.classList.toggle('active', item === button));
      filterMarkets();
    });
  }

  function enrichExistingRows() {
    $$('.marketRow[data-symbol]').forEach(row => {
      const symbol = row.dataset.symbol;
      if (row.dataset.kind === 'spot' && !row.dataset.quote) row.dataset.quote = quoteAsset(symbol);
      const price = Number(row.dataset.priceValue || parsePrice(row.querySelector('.marketLast strong')?.textContent));
      state.priceMap.set(symbol, price || 1);
      state.baseMap.set(symbol, price || 1);
    });
  }

  function addSpotPairs() {
    const table = $('.marketTable');
    if (!table) return;
    const existing = new Set($$('.marketRow[data-symbol]').map(row => row.dataset.symbol));
    spotMarkets.forEach(item => {
      if (existing.has(item.symbol)) return;
      const row = document.createElement('article');
      row.className = 'marketRow';
      row.dataset.kind = 'spot';
      row.dataset.symbol = item.symbol;
      row.dataset.sub = 'SPOT';
      row.dataset.badge = 'SPOT';
      row.dataset.quote = item.quote;
      row.dataset.price = `$${item.price}`;
      row.dataset.priceValue = String(item.price);
      row.dataset.change = item.change;
      row.dataset.changePercent = item.change.replace('%', '');
      row.dataset.chartSymbol = item.chart;
      row.dataset.chartTitle = item.title;
      row.dataset.tvUrl = `https://www.tradingview.com/symbols/${item.title.replace(' / ', '')}/`;
      row.innerHTML = `
        <button class="starButton" type="button" aria-label="Save ${item.symbol} as favorite">☆</button>
        <button class="marketMain" type="button"><span class="pairName">${item.symbol.replace('/', '<span>/')}${item.symbol.includes('/') ? '</span>' : ''}</span><small class="marketBadge">SPOT</small></button>
        <div class="marketVolume">${item.volume}</div><div class="marketLast"><strong>${formatNumber(item.price)}</strong><em${item.change.startsWith('-') ? ' class="down"' : ''}>${item.change}</em></div>
      `;
      table.append(row);
      state.priceMap.set(item.symbol, item.price);
      state.baseMap.set(item.symbol, item.price);
    });
  }

  function activeMainFilter() {
    return $('.marketModeTabs button.active')?.dataset.marketFilter || 'all';
  }

  function walletConnected() {
    return localStorage.getItem('shypeWalletConnected') === 'true';
  }

  function favorites() {
    try { return new Set(JSON.parse(localStorage.getItem('shypeFavorites') || '[]')); }
    catch { return new Set(); }
  }

  function saveFavorites(set) {
    localStorage.setItem('shypeFavorites', JSON.stringify([...set]));
  }

  function updateStars() {
    const favs = favorites();
    $$('.marketRow[data-symbol]').forEach(row => {
      const star = $('.starButton', row);
      if (!star) return;
      const active = favs.has(row.dataset.symbol);
      star.classList.toggle('active', active);
      star.textContent = active ? '★' : '☆';
    });
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  function filterMarkets() {
    const main = activeMainFilter();
    const query = ($('#marketSearch')?.value || '').trim().toLowerCase();
    const favs = favorites();
    $('.quoteTabs')?.classList.toggle('visible', main === 'spot');
    let visible = 0;
    $$('.marketRow[data-symbol]').forEach(row => {
      const kind = kindFromRow(row);
      const symbol = (row.dataset.symbol || '').toLowerCase();
      const text = row.textContent.toLowerCase();
      const matchesMain = main === 'all' || kind === main || (main === 'favorites' && favs.has(row.dataset.symbol));
      const matchesQuote = main !== 'spot' || state.activeQuote === 'all' || row.dataset.quote === state.activeQuote;
      const matchesSearch = !query || symbol.includes(query) || text.includes(query);
      const show = matchesMain && matchesQuote && matchesSearch;
      row.hidden = !show;
      if (show) visible += 1;
    });
    const empty = $('#emptyMarketState');
    if (empty) {
      empty.classList.toggle('visible', visible === 0);
      empty.textContent = main === 'favorites' && !walletConnected()
        ? 'Connect wallet to save and view favorites.'
        : 'No markets match this filter.';
    }
  }

  function setMarket(row) {
    if (!row) return;
    const symbol = row.dataset.symbol;
    const kind = kindFromRow(row);
    const price = state.priceMap.get(symbol) || Number(row.dataset.priceValue || 1);
    const base = state.baseMap.get(symbol) || Number(row.dataset.priceValue || 1);
    const pct = base ? ((price - base) / base) * 100 : 0;
    $('.marketIdentity img')?.setAttribute('src', kind === 'perps' && symbol.startsWith('BTC') ? '' : 'IMG_2365.png?v=36');
    const title = $('.marketIdentity strong');
    const sub = $('.marketIdentity small');
    if (title) title.textContent = symbol;
    if (sub) sub.textContent = kind === 'perps' ? row.dataset.badge || '10x' : 'SPOT';
    const priceNode = $('.marketNumbers strong');
    const changeNode = $('.marketNumbers span');
    if (priceNode) priceNode.textContent = formatNumber(price);
    if (changeNode) changeNode.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    const chartTitle = $('.chartTopline strong');
    const chartLink = $('.chartTopline a');
    const frame = $('.chartFrame iframe');
    if (chartTitle) chartTitle.textContent = row.dataset.chartTitle || `${baseAsset(symbol)} / USDT`;
    if (chartLink && row.dataset.tvUrl) chartLink.href = row.dataset.tvUrl;
    if (frame && row.dataset.chartSymbol) {
      frame.title = `${row.dataset.chartTitle || symbol} live chart`;
      frame.src = tradingViewUrl(row.dataset.chartSymbol);
    }
    state.currentSymbol = symbol;
    renderTicket();
  }

  function miniBookRows(symbol) {
    const price = state.priceMap.get(symbol) || 1;
    const base = baseAsset(symbol);
    const asks = [];
    const bids = [];
    for (let i = 5; i >= 1; i -= 1) asks.push({ price: price * (1 + i * 0.00016), size: Math.abs(Math.sin(i + price)) * 5 + i * .37 });
    for (let i = 1; i <= 5; i += 1) bids.push({ price: price * (1 - i * 0.00016), size: Math.abs(Math.cos(i + price)) * 5 + i * .31 });
    return { base, asks, bids, price };
  }

  function renderTicket() {
    const ticket = $('.tradeTicket');
    if (!ticket) return;
    ticket.classList.add('proTicket');
    const row = selectedRow();
    const symbol = state.currentSymbol || row?.dataset.symbol || 'SOL-USDC';
    const kind = kindFromRow(row);
    const base = baseAsset(symbol);
    const quote = quoteAsset(symbol);
    const leverage = row?.dataset.badge || '10x';
    const book = miniBookRows(symbol);
    const isPerp = kind === 'perps';

    ticket.innerHTML = `
      <div class="ticketForm">
        ${isPerp ? `
          <div class="ticketTopControls">
            <button type="button">Market⌄</button>
            <button type="button">Cross⌄</button>
            <button type="button">${leverage}⌄</button>
          </div>
          <div class="sideTabs"><button class="active" type="button">Buy / Long</button><button type="button">Sell / Short</button></div>
          <div class="ticketBalance"><span>Avail. to Trade</span><strong>0,00 USDC</strong></div>
          <label class="compactInput"><input id="tradeAmount" type="number" inputmode="decimal" min="0" step="0.01" value="0" /><em>${base}⌄</em></label>
          <div class="percentRow"><span class="fakeSlider"></span><span class="percentBox">0&nbsp;%</span></div>
          <label class="checkLine"><i></i><span>Reduce Only</span></label>
          <label class="checkLine"><i></i><span>Take Profit / Stop Loss</span></label>
          <div class="ticketDivider"></div>
          <div class="ticketMetric"><span>Liquidation Price</span><strong>N/A</strong></div>
          <div class="ticketMetric"><span>Order Value</span><strong>N/A</strong></div>
          <div class="ticketMetric"><span>Margin Required</span><strong>N/A</strong></div>
          <div class="ticketMetric"><span>Slippage</span><strong style="color:var(--blue)">Est: 0% / Max: 8,00%</strong></div>
          <button class="ticketAction" type="button" data-open-demo>Connect</button>
        ` : `
          <div class="ticketTopControls"><button type="button">Swap⌄</button><button type="button">Exact In⌄</button><button type="button">${quote}⌄</button></div>
          <div class="spotRouteLine"><span>From</span><strong>SOL</strong></div>
          <label class="compactInput"><input id="tradeAmount" type="number" inputmode="decimal" min="0" step="0.01" value="1" /><em>SOL</em></label>
          <div class="spotRouteLine"><span>To</span><strong>${base}</strong></div>
          <label class="compactInput"><input type="text" value="≈ ${formatNumber(1 / Math.max(book.price, .00001))}" readonly /><em>${base}</em></label>
          <div class="ticketMetric"><span>Route</span><strong>Jupiter · ${symbol}</strong></div>
          <div class="ticketMetric"><span>Slippage</span><strong style="color:var(--blue)">0,5%</strong></div>
          <button class="ticketAction secondary" type="button" data-open-demo>Connect wallet</button>
        `}
      </div>
      <aside class="miniOrderBook" aria-label="Mini order book">
        <div class="miniBookHead"><span>Price</span><span>Size (${base})</span></div>
        ${book.asks.map((level, index) => `<div class="miniBookRow ask"><i class="miniBar" style="width:${30 + index * 11}%"></i><span class="askPrice">${formatNumber(level.price)}</span><span>${level.size.toLocaleString('de-DE', { maximumFractionDigits: 5 })}</span></div>`).join('')}
        <div class="midPrice">${formatNumber(book.price)}</div>
        ${book.bids.map((level, index) => `<div class="miniBookRow bid"><i class="miniBar" style="width:${35 + index * 10}%"></i><span class="bidPrice">${formatNumber(level.price)}</span><span>${level.size.toLocaleString('de-DE', { maximumFractionDigits: 5 })}</span></div>`).join('')}
      </aside>
    `;
  }

  function addPosition() {
    const row = selectedRow();
    const symbol = state.currentSymbol || row?.dataset.symbol || 'SOL-USDC';
    const kind = kindFromRow(row);
    const amount = Number($('#tradeAmount')?.value || 0) || 0;
    const entry = state.priceMap.get(symbol) || Number(row?.dataset.priceValue || 1);
    state.positions.unshift({ id: Date.now(), symbol, kind, amount, entry });
    renderPositions();
  }

  function renderPositions() {
    const list = $('#positionsList');
    if (!list) return;
    if (!state.positions.length) {
      list.innerHTML = '<div class="emptyState"><span>No open positions</span><button type="button" data-view="markets">Choose market</button></div>';
      return;
    }
    list.innerHTML = state.positions.map(position => {
      const current = state.priceMap.get(position.symbol) || position.entry;
      const pnl = (current - position.entry) * position.amount;
      const pct = position.entry ? ((current - position.entry) / position.entry) * 100 : 0;
      const down = pnl < 0 ? ' down' : '';
      return `<article class="positionRow"><div><h3>${position.symbol}<span class="kindPill">${position.kind}</span></h3><p>${position.amount.toFixed(2)} input · Entry $${formatNumber(position.entry)} · Now $${formatNumber(current)}</p></div><div class="positionPnl"><strong class="${down.trim()}">$${formatNumber(pnl)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)</strong><button type="button" data-close-local="${position.id}">Close</button></div></article>`;
    }).join('');
  }

  function tickPrices() {
    $$('.marketRow[data-symbol]').forEach(row => {
      const symbol = row.dataset.symbol;
      const current = state.priceMap.get(symbol) || Number(row.dataset.priceValue || 1);
      const volatility = current > 1000 ? 0.0008 : current > 10 ? 0.0012 : 0.0018;
      const next = Math.max(0.00001, current * (1 + (Math.random() - 0.5) * volatility));
      state.priceMap.set(symbol, next);
      const priceNode = $('.marketLast strong', row);
      const changeNode = $('.marketLast em', row);
      const base = state.baseMap.get(symbol) || current;
      const pct = ((next - base) / base) * 100;
      if (priceNode) priceNode.textContent = formatNumber(next);
      if (changeNode) {
        changeNode.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
        changeNode.classList.toggle('down', pct < 0);
      }
    });
    const row = selectedRow();
    if (row) setMarket(row);
    renderPositions();
  }

  function bind() {
    document.addEventListener('click', event => {
      const star = event.target.closest('.starButton');
      if (star) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const row = star.closest('.marketRow');
        if (!walletConnected()) {
          showToast('Connect wallet to save favorites.');
          return;
        }
        const favs = favorites();
        if (favs.has(row.dataset.symbol)) favs.delete(row.dataset.symbol);
        else favs.add(row.dataset.symbol);
        saveFavorites(favs);
        updateStars();
        filterMarkets();
        return;
      }
      const marketButton = event.target.closest('.marketMain');
      if (marketButton) {
        const row = marketButton.closest('.marketRow');
        setMarket(row);
        if (typeof window.openView === 'function') window.openView('trade');
        return;
      }
      const modeButton = event.target.closest('[data-market-filter]');
      if (modeButton) setTimeout(filterMarkets, 0);
      const openButton = event.target.closest('[data-open-demo]');
      if (openButton) {
        addPosition();
        showToast('Demo position added. Real execution will connect through wallet/Jupiter later.');
      }
      const closeButton = event.target.closest('[data-close-local]');
      if (closeButton) {
        state.positions = state.positions.filter(item => item.id !== Number(closeButton.dataset.closeLocal));
        renderPositions();
      }
    }, true);

    $('#marketSearch')?.addEventListener('input', () => setTimeout(filterMarkets, 0));
  }

  function init() {
    addQuoteTabs();
    enrichExistingRows();
    addSpotPairs();
    updateStars();
    bind();
    const row = selectedRow();
    if (row) setMarket(row);
    filterMarkets();
    setInterval(tickPrices, 2600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
  else setTimeout(init, 80);
})();