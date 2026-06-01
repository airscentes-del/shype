(() => {
  const spotMarkets = [
    { symbol:'BTC/SOL', quote:'SOL', price:899.42, volume:'$9,8 Mio.', change:'+0.22%', chart:'BINANCE%3ABTCUSDT', title:'BTC / USDT' },
    { symbol:'BTC/USDT', quote:'USDT', price:73915, volume:'$18,4 Mio.', change:'+0.14%', chart:'BINANCE%3ABTCUSDT', title:'BTC / USDT' },
    { symbol:'ETH/SOL', quote:'SOL', price:24.36, volume:'$4,7 Mio.', change:'-0.41%', chart:'BINANCE%3AETHUSDT', title:'ETH / USDT' },
    { symbol:'ETH/USDT', quote:'USDT', price:2004.5, volume:'$8,2 Mio.', change:'-0.71%', chart:'BINANCE%3AETHUSDT', title:'ETH / USDT' },
    { symbol:'HYPE/SOL', quote:'SOL', price:0.879, volume:'$7,4 Mio.', change:'+6.97%', chart:'BITGET%3AHYPEUSDT', title:'HYPE / USDT' },
    { symbol:'HYPE/USDT', quote:'USDT', price:72.31, volume:'$12,8 Mio.', change:'+6.97%', chart:'BITGET%3AHYPEUSDT', title:'HYPE / USDT' },
    { symbol:'SOL/USDT', quote:'USDT', price:82.24, volume:'$6,1 Mio.', change:'-0.33%', chart:'BINANCE%3ASOLUSDT', title:'SOL / USDT' },
    { symbol:'JUP/SOL', quote:'SOL', price:0.00759, volume:'$2,9 Mio.', change:'+2.41%', chart:'BINANCE%3AJUPUSDT', title:'JUP / USDT' },
    { symbol:'JUP/USDC', quote:'USDC', price:0.624, volume:'$5,8 Mio.', change:'+2.41%', chart:'BINANCE%3AJUPUSDT', title:'JUP / USDT' },
    { symbol:'WIF/SOL', quote:'SOL', price:0.00948, volume:'$3,2 Mio.', change:'+4.02%', chart:'BINANCE%3AWIFUSDT', title:'WIF / USDT' },
    { symbol:'WIF/USDC', quote:'USDC', price:0.781, volume:'$4,9 Mio.', change:'+4.02%', chart:'BINANCE%3AWIFUSDT', title:'WIF / USDT' }
  ];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const format = v => Number(v).toLocaleString('de-DE', { maximumFractionDigits: Number(v) >= 1000 ? 0 : 5 });
  const base = s => String(s || 'SOL').split(/[/-]/)[0];
  const quote = s => String(s || '').split(/[/-]/)[1] || 'USDC';
  const tv = s => `https://s.tradingview.com/widgetembed/?symbol=${s}&interval=60&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=1&save_image=0&studies=[]&locale=en#%7B%22page-uri%22%3A%22shype.app%2Fapp.html%22%7D`;
  function toast(message) { const t = $('#toast'); if (!t) return; t.textContent = message; t.classList.add('visible'); setTimeout(() => t.classList.remove('visible'), 2200); }
  function addQuoteTabs() {
    if ($('.quoteTabs')) return;
    const mode = $('.marketModeTabs'); if (!mode) return;
    const nav = document.createElement('nav');
    nav.className = 'quoteTabs';
    nav.innerHTML = '<button class="active" type="button" data-quote-filter="all">All</button><button type="button" data-quote-filter="USDC">USDC</button><button type="button" data-quote-filter="SOL">SOL</button><button type="button" data-quote-filter="USDT">USDT</button>';
    mode.after(nav);
    nav.addEventListener('click', e => { const b = e.target.closest('[data-quote-filter]'); if (!b) return; $$('.quoteTabs button').forEach(x => x.classList.toggle('active', x === b)); filterMarkets(); });
  }
  function addSpotPairs() {
    const table = $('.marketTable'); if (!table) return;
    const existing = new Set($$('.marketRow[data-symbol]').map(r => r.dataset.symbol));
    spotMarkets.forEach(item => {
      if (existing.has(item.symbol)) return;
      const row = document.createElement('article');
      row.className = 'marketRow';
      row.dataset.kind = 'spot'; row.dataset.symbol = item.symbol; row.dataset.sub = 'SPOT'; row.dataset.badge = 'SPOT'; row.dataset.quote = item.quote; row.dataset.priceValue = String(item.price); row.dataset.change = item.change; row.dataset.changePercent = item.change.replace('%',''); row.dataset.chartSymbol = item.chart; row.dataset.chartTitle = item.title; row.dataset.tvUrl = `https://www.tradingview.com/symbols/${item.title.replace(/\s\/\s/g,'')}/`;
      row.innerHTML = `<button class="starButton" type="button" aria-label="Save ${item.symbol} as favorite">☆</button><button class="marketMain" type="button"><span class="pairName">${item.symbol.replace('/', '<span>/')}</span></span><small class="marketBadge">SPOT</small></button><div class="marketVolume">${item.volume}</div><div class="marketLast"><strong>${format(item.price)}</strong><em${item.change.startsWith('-')?' class="down"':''}>${item.change}</em></div>`;
      table.append(row);
    });
  }
  function activeFilter() { return $('.marketModeTabs button.active')?.dataset.marketFilter || 'all'; }
  function activeQuote() { return $('.quoteTabs button.active')?.dataset.quoteFilter || 'all'; }
  function favs() { try { return new Set(JSON.parse(localStorage.getItem('shypeFavorites') || '[]')); } catch { return new Set(); } }
  function saveFavs(set) { localStorage.setItem('shypeFavorites', JSON.stringify([...set])); }
  function updateStars() { const f = favs(); $$('.marketRow[data-symbol]').forEach(r => { const s = $('.starButton', r); if (!s) return; const on = f.has(r.dataset.symbol); s.textContent = on ? '★' : '☆'; s.classList.toggle('active', on); }); }
  function filterMarkets() {
    const mode = activeFilter(), q = activeQuote(), search = ($('#marketSearch')?.value || '').toLowerCase().trim(), f = favs();
    $('.quoteTabs')?.classList.toggle('visible', mode === 'spot');
    let count = 0;
    $$('.marketRow[data-symbol]').forEach(row => {
      const kind = row.dataset.kind || 'spot', symbol = (row.dataset.symbol || '').toLowerCase();
      const okMode = mode === 'all' || kind === mode || (mode === 'favorites' && f.has(row.dataset.symbol));
      const okQuote = mode !== 'spot' || q === 'all' || row.dataset.quote === q || quote(row.dataset.symbol) === q;
      const okSearch = !search || symbol.includes(search) || row.textContent.toLowerCase().includes(search);
      row.hidden = !(okMode && okQuote && okSearch); if (!row.hidden) count++;
    });
    const empty = $('#emptyMarketState'); if (empty) { empty.classList.toggle('visible', count === 0); empty.textContent = mode === 'favorites' && localStorage.getItem('shypeWalletConnected') !== 'true' ? 'Connect wallet to save and view favorites.' : 'No markets match this filter.'; }
  }
  function setMarket(row) {
    if (!row) return;
    const symbol = row.dataset.symbol, kind = row.dataset.kind || 'spot';
    const title = $('.marketIdentity strong'), sub = $('.marketIdentity small'), price = $('.marketNumbers strong'), change = $('.marketNumbers span'), ct = $('.chartTopline strong'), cl = $('.chartTopline a'), frame = $('.chartFrame iframe');
    if (title) title.textContent = symbol; if (sub) sub.textContent = kind === 'perps' ? row.dataset.badge || '10x' : 'SPOT'; if (price) price.textContent = format(row.dataset.priceValue || 1); if (change) change.textContent = row.dataset.change || '';
    if (ct) ct.textContent = row.dataset.chartTitle || `${base(symbol)} / USDT`; if (cl && row.dataset.tvUrl) cl.href = row.dataset.tvUrl; if (frame && row.dataset.chartSymbol) { frame.title = `${row.dataset.chartTitle || symbol} live chart`; frame.src = tv(row.dataset.chartSymbol); }
    if (typeof window.openView === 'function') window.openView('trade');
  }
  function bind() {
    document.addEventListener('click', e => {
      const star = e.target.closest('.starButton');
      if (star) { e.preventDefault(); e.stopPropagation(); const row = star.closest('.marketRow'); if (localStorage.getItem('shypeWalletConnected') !== 'true') return toast('Connect wallet to save favorites.'); const f = favs(); f.has(row.dataset.symbol) ? f.delete(row.dataset.symbol) : f.add(row.dataset.symbol); saveFavs(f); updateStars(); filterMarkets(); return; }
      const market = e.target.closest('.marketMain'); if (market) { setMarket(market.closest('.marketRow')); return; }
      if (e.target.closest('[data-market-filter]')) setTimeout(filterMarkets, 0);
    }, true);
    $('#marketSearch')?.addEventListener('input', filterMarkets);
  }
  function init() { addQuoteTabs(); addSpotPairs(); bind(); updateStars(); filterMarkets(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
