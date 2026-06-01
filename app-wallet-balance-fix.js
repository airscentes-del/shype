(() => {
  const TOKEN_PROGRAMS = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  ];
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoqqwjyGKJnMhxGduzxVT';
  const FEE_RESERVE_SOL = 0.002;
  const RPCS = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
    'https://rpc.ankr.com/solana'
  ];
  const KNOWN = {
    [SOL_MINT]: { symbol: 'SOL', name: 'Solana', price: 82 },
    [USDC_MINT]: { symbol: 'USDC', name: 'USD Coin', price: 1 },
    [USDT_MINT]: { symbol: 'USDT', name: 'Tether USD', price: 1 }
  };
  const state = { address: '', tokens: [], balances: {}, prices: {}, meta: {}, loading: false, error: '', pct: 0, lastLoad: 0 };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const style = document.createElement('style');
  style.textContent = `
    :root{--shype-blue:#58caff;--shype-soft:#9db0bb;--shype-line:rgba(145,211,239,.18);--shype-red:#ff819e;}
    #buyButton,.buyButton,[data-open-demo],.accountSheet.compact .primaryWide,.emptyState button[data-view="markets"]{display:none!important;pointer-events:none!important;}
    .tradeTicket.stable{display:grid!important;grid-template-columns:minmax(0,54%) minmax(148px,46%);padding:0!important;background:#071722!important;border-top:1px solid var(--shype-line);border-bottom:1px solid var(--shype-line);overflow:hidden!important;}
    .sform{padding:15px 22px 16px;border-right:1px solid var(--shype-line);min-width:0}.sctrl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px}.sctrl button{border:0;background:transparent;color:#b7c6ce;text-align:left;font-size:12px;padding:0}.sbal,.sline,.smetric{display:flex;justify-content:space-between;gap:10px;color:var(--shype-soft);font-size:13px;margin:8px 0}.sbal strong,.sline strong,.smetric strong{color:#eef8ff;font-weight:500;text-align:right}.sinp{height:46px;border:1px solid rgba(145,211,239,.2);border-radius:12px;background:rgba(3,15,24,.45);display:grid;grid-template-columns:1fr auto;align-items:center;padding:0 13px;min-width:0}.sinp input{border:0!important;outline:0!important;background:transparent!important;color:#eef8ff!important;width:100%;font-size:16px;min-width:0}.sinp em{font-style:normal;color:#c8d6dc;font-size:15px}.sslider{display:grid;grid-template-columns:1fr 54px;gap:12px;align-items:center;margin:13px 0 16px}.sslider input{-webkit-appearance:none;appearance:none;width:100%;height:7px;border-radius:999px;background:linear-gradient(90deg,var(--shype-blue) 0%,var(--shype-blue) var(--pct),rgba(145,211,239,.25) var(--pct),rgba(145,211,239,.25) 100%);outline:0;touch-action:pan-y}.sslider input::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:var(--shype-blue);border:4px solid #071722;box-shadow:0 0 0 1px rgba(88,202,255,.75),0 4px 14px rgba(0,0,0,.45)}.sslider strong{height:38px;border:1px solid rgba(145,211,239,.24);border-radius:11px;display:grid;place-items:center;color:#eef8ff;font-size:14px;font-weight:430}.sbtn{width:100%;height:48px;border-radius:13px;border:1px solid rgba(88,202,255,.45);background:linear-gradient(135deg,#78e5f4,#4dbef7);color:#06131d;font-weight:650;font-size:16px;margin-top:13px}.sbtn:disabled{background:transparent;color:var(--shype-blue);opacity:.48}.sok{color:var(--shype-blue)!important}.sbad{color:var(--shype-red)!important}.sbook{padding:13px 12px 13px 18px;overflow:hidden}.sbook h4{display:grid;grid-template-columns:1fr 1fr;color:var(--shype-soft);font-size:12px;font-weight:400;margin:0 0 8px}.sbook div{display:grid;grid-template-columns:1fr 1fr;position:relative;min-height:25px;font-size:13px}.sbook i{position:absolute;right:0;height:20px;opacity:.55}.ask{color:var(--shype-red)}.bid{color:var(--shype-blue)}.mid{color:var(--shype-red)!important;font-size:23px!important;display:block!important;margin:6px 0!important}.ask i{background:rgba(255,129,158,.18)}.bid i{background:rgba(88,202,255,.18)}
    .swallet{border:1px solid var(--shype-line);border-radius:16px;background:rgba(255,255,255,.012);overflow:hidden}.srow{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px 14px;border-bottom:1px solid rgba(145,211,239,.13)}.srow:last-child{border-bottom:0}.srow h3{margin:0;color:#eef8ff;font-size:17px;font-weight:520}.srow p{margin:3px 0 0;color:#91a5b0;font-size:12px}.srow strong{text-align:right;color:#eef8ff;font-size:17px;font-weight:430}.srow small{display:block;color:#91a5b0;font-size:12px}.sbox{padding:14px 18px}.sbox p{margin:0;color:#9db0bb;font-size:14px;line-height:1.45}.serror{color:var(--shype-red)!important}.shelp{color:#91a5b0;font-size:12px;margin-top:10px!important}.sideTabs{display:grid;grid-template-columns:1fr 1fr;border-radius:12px;background:rgba(255,255,255,.055);padding:2px;margin-bottom:12px}.sideTabs button{height:39px;border:0;border-radius:10px;background:transparent;color:#eaf4f8;font-size:14px}.sideTabs .active{background:var(--shype-blue);color:#06131d}
  `;
  document.head.appendChild(style);

  function textKey(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }
  function validAddress(value) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || '')); }
  function shortAddress(value) { return value ? `${value.slice(0, 4)}…${value.slice(-4)}` : 'Connect'; }
  function provider() {
    return window.phantom?.solana || window.solana || window.solflare || window.backpack?.solana || window.glowSolana || window.okxwallet?.solana || window.okxWallet?.solana || null;
  }
  function currentAddress() {
    const pk = textKey(provider()?.publicKey);
    if (validAddress(pk)) {
      localStorage.setItem('shypeWalletPublicKey', pk);
      localStorage.setItem('shypeWalletConnected', 'true');
      return pk;
    }
    const saved = localStorage.getItem('shypeWalletPublicKey') || '';
    return validAddress(saved) ? saved : '';
  }
  function fmt(value, digits = 6) { return Number(value || 0).toLocaleString('de-DE', { maximumFractionDigits: digits }); }
  function usd(value) { return '$' + Number(value || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function tinyMint(mint) { return mint ? `${mint.slice(0, 4)}…${mint.slice(-4)}` : ''; }
  function parseNumber(value) {
    const s = String(value || 0).replace(/[$€\s]/g, '');
    return s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) || 0 : Number(s.replace(/,/g, '')) || 0;
  }
  function base(symbol) { return String(symbol || '').split(/[/-]/)[0] || 'SOL'; }
  function quote(symbol) { return String(symbol || '').split(/[/-]/)[1] || 'USDC'; }
  function marketRow() {
    const symbol = $('.marketIdentity strong')?.textContent?.trim() || '';
    return $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`) || $('.marketRow[data-symbol]');
  }
  function marketKind(row) { return row?.dataset.kind || (String(row?.dataset.symbol || '').includes('-') ? 'perps' : 'spot'); }
  function marketPrice(row) {
    return parseNumber(row?.querySelector('.marketLast strong')?.textContent || row?.dataset.priceValue || 1) || 1;
  }
  function solUsd() { return marketPrice($('.marketRow[data-symbol="SOL/USDC"]') || $('.marketRow[data-symbol="SOL/USDT"]')) || 82; }
  function tokenValue(token) {
    const price = token.price || state.prices[token.mint] || state.prices[token.symbol] || 0;
    return price ? token.amount * price : 0;
  }
  function bal(symbol) { return Number(state.balances[symbol] || 0); }
  function tokenProgramName(programId) { return programId === TOKEN_PROGRAMS[1] ? 'Token-2022' : 'SPL Token'; }

  async function rpc(method, params) {
    let lastError;
    for (const url of RPCS) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'RPC error');
        return json.result;
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error('RPC failed');
  }

  async function loadTokenMeta() {
    if (state.metaLoaded) return;
    state.metaLoaded = true;
    const urls = ['https://tokens.jup.ag/tokens?tags=verified', 'https://token.jup.ag/all'];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        const list = await res.json();
        if (Array.isArray(list)) {
          list.forEach(item => {
            if (item?.address) state.meta[item.address] = { symbol: item.symbol || tinyMint(item.address), name: item.name || 'Solana token', decimals: item.decimals };
          });
          return;
        }
      } catch {}
    }
  }

  async function loadPrices(tokens) {
    const ids = tokens.map(t => t.mint).filter(Boolean).slice(0, 50);
    if (!ids.length) return;
    try {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${encodeURIComponent(ids.join(','))}`);
      const data = await res.json();
      Object.entries(data || {}).forEach(([mint, item]) => {
        const p = Number(item?.usdPrice || item?.price || item);
        if (p > 0) state.prices[mint] = p;
      });
    } catch {}
    state.prices[SOL_MINT] = state.prices.SOL = solUsd();
    state.prices[USDC_MINT] = state.prices.USDC = 1;
    state.prices[USDT_MINT] = state.prices.USDT = 1;
  }

  function addBalance(map, key, amount) { map[key] = Number(map[key] || 0) + Number(amount || 0); }

  async function fetchParsedTokenAccounts(address, programId) {
    const result = await rpc('getParsedTokenAccountsByOwner', [address, { programId }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
    return (result?.value || []).map(entry => {
      const info = entry?.account?.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount || {};
      const amount = Number(tokenAmount.uiAmountString || tokenAmount.uiAmount || 0);
      const mint = info?.mint || '';
      if (!mint || amount <= 0) return null;
      const known = KNOWN[mint] || state.meta[mint] || {};
      return { mint, amount, symbol: known.symbol || tinyMint(mint), name: known.name || tokenProgramName(programId), programId, price: known.price || 0 };
    }).filter(Boolean);
  }

  async function loadBalances(force = false) {
    const address = currentAddress();
    if (!address) return;
    if (state.loading || (!force && state.address === address && Date.now() - state.lastLoad < 8000)) return;
    state.loading = true;
    state.address = address;
    state.error = '';
    renderAll();
    await loadTokenMeta();
    const tokens = [];
    const balances = {};
    try {
      const solBalance = await rpc('getBalance', [address, { commitment: 'confirmed' }]);
      const amount = Number(solBalance?.value || 0) / 1e9;
      tokens.push({ mint: SOL_MINT, symbol: 'SOL', name: 'Solana', amount, price: solUsd(), programId: 'native' });
      addBalance(balances, 'SOL', amount);
      addBalance(balances, SOL_MINT, amount);
    } catch (error) {
      state.error = 'Could not load SOL balance.';
    }
    const failures = [];
    for (const programId of TOKEN_PROGRAMS) {
      try {
        const list = await fetchParsedTokenAccounts(address, programId);
        list.forEach(token => {
          tokens.push(token);
          addBalance(balances, token.symbol, token.amount);
          addBalance(balances, token.mint, token.amount);
        });
      } catch (error) { failures.push(programId); }
    }
    await loadPrices(tokens);
    tokens.forEach(token => { if (!token.price && state.prices[token.mint]) token.price = state.prices[token.mint]; });
    state.tokens = tokens.sort((a, b) => (b.symbol === 'SOL') - (a.symbol === 'SOL') || tokenValue(b) - tokenValue(a));
    state.balances = balances;
    state.loading = false;
    state.lastLoad = Date.now();
    if (failures.length && state.tokens.length <= 1) state.error = 'Token balances could not be loaded from public RPC. Refresh once, or open inside the wallet browser.';
    renderAll();
  }

  function walletRows() {
    if (state.loading && !state.tokens.length) return '<p>Loading wallet balances…</p>';
    if (!state.tokens.length) return `<p class="${state.error ? 'serror' : ''}">${state.error || 'No token balances found.'}</p>`;
    return `<div class="swallet">${state.tokens.map(token => {
      const value = tokenValue(token);
      const reserveText = token.symbol === 'SOL' ? ` · ${FEE_RESERVE_SOL} SOL fee reserve` : '';
      const small = value ? usd(value) : tinyMint(token.mint);
      return `<article class="srow"><div><h3>${token.symbol}</h3><p>${token.name}${reserveText}</p></div><strong>${fmt(token.amount, token.amount < 1 ? 6 : 4)}<small>${small}</small></strong></article>`;
    }).join('')}</div>${state.error ? `<p class="shelp">${state.error}</p>` : ''}`;
  }

  function renderAccount() {
    const sheet = $('.appView[data-panel="account"] .accountSheet');
    const address = currentAddress();
    if (!sheet) return;
    sheet.classList.remove('compact');
    sheet.innerHTML = address ? `<h2>Wallet</h2><p class="walletStatusText">Wallet connected: ${shortAddress(address)}</p>${walletRows()}` : '<h2>Wallet</h2><p class="walletStatusText">No wallet connected.</p>';
  }

  function renderPortfolio() {
    const sheet = $('.appView[data-panel="portfolio"] .accountSheet');
    if (!sheet) return;
    const value = state.tokens.reduce((sum, token) => sum + tokenValue(token), 0);
    sheet.innerHTML = `<h2>Account equity</h2><div><span>Spot</span><strong>${usd(value)}</strong></div><div><span>Perps</span><strong>$0.00</strong></div><hr><h2>Wallet assets</h2>${walletRows()}`;
  }

  function renderPanel() {
    const list = $('#positionsList');
    if (!list) return;
    const tab = $('.accountTabs button.active')?.textContent?.trim().toLowerCase() || 'positions';
    if (tab.includes('balance')) list.innerHTML = `<div class="sbox">${walletRows()}</div>`;
    else if (tab.includes('open')) list.innerHTML = '<div class="sbox"><p>No open orders yet.</p></div>';
    else if (tab.includes('history')) list.innerHTML = '<div class="sbox"><p>No SHYPE trades yet.</p></div>';
    else list.innerHTML = '<div class="emptyState"><span>No open positions</span></div>';
  }

  function book(symbol) {
    const price = marketPrice(marketRow());
    const asset = base(symbol);
    const asks = [5, 4, 3, 2, 1];
    const bids = [1, 2, 3, 4, 5];
    return `<aside class="sbook"><h4><span>Price</span><span>Size (${asset})</span></h4>${asks.map((n, i) => `<div class="ask"><i style="width:${35 + i * 12}%"></i><span>${fmt(price * (1 + n * .00016), 3)}</span><span>${fmt(Math.abs(Math.sin(price + n)) * 6, 5)}</span></div>`).join('')}<strong class="mid">${fmt(price, 3)}</strong>${bids.map((n, i) => `<div class="bid"><i style="width:${35 + i * 12}%"></i><span>${fmt(price * (1 - n * .00016), 3)}</span><span>${fmt(Math.abs(Math.cos(price + n)) * 6, 5)}</span></div>`).join('')}</aside>`;
  }

  function renderTicket() {
    const ticket = $('.tradeTicket');
    const row = marketRow();
    if (!ticket || !row) return;
    const symbol = row.dataset.symbol || 'SOL/USDC';
    const isPerp = marketKind(row) === 'perps';
    const output = base(symbol);
    const q = quote(symbol);
    const input = isPerp ? 'USDC' : (q === 'USD' ? 'USDC' : q);
    const raw = bal(input);
    const available = input === 'SOL' ? Math.max(raw - FEE_RESERVE_SOL, 0) : raw;
    const spend = available * state.pct / 100;
    const receive = isPerp ? spend : spend * (input === 'SOL' ? solUsd() : 1) / Math.max(marketPrice(row), 0.000001);
    const hasFee = bal('SOL') >= FEE_RESERVE_SOL;
    const connected = Boolean(currentAddress());
    const canTrade = connected && hasFee && spend > 0;
    ticket.className = 'tradeTicket stable';
    ticket.innerHTML = `<div class="sform"><div class="sctrl"><button>${isPerp ? 'Market' : 'Swap'}⌄</button><button>Exact In⌄</button><button>${input}⌄</button></div>${isPerp ? '<div class="sideTabs"><button class="active" type="button">Buy / Long</button><button type="button">Sell / Short</button></div>' : ''}<div class="sbal"><span>Available</span><strong>${fmt(available, input === 'SOL' ? 6 : 4)} ${input}</strong></div><div class="sline"><span>From</span><strong>${input}</strong></div><label class="sinp"><input id="stableAmount" type="number" value="${spend ? spend.toFixed(input === 'SOL' ? 6 : 4) : '0'}"><em>${input}</em></label><div class="sslider"><input id="stablePct" style="--pct:${state.pct}%" type="range" min="0" max="100" step="1" value="${state.pct}"><strong>${Math.round(state.pct)}%</strong></div><div class="sline"><span>${isPerp ? 'Position value' : 'To'}</span><strong>${isPerp ? 'USDC' : output}</strong></div><label class="sinp"><input readonly value="≈ ${fmt(receive, output === 'BTC' ? 6 : 4)}"><em>${isPerp ? 'notional' : output}</em></label><div class="smetric"><span>Route</span><strong>${isPerp ? 'Jupiter Perps' : `Jupiter · ${input}/${output}`}</strong></div><div class="smetric"><span>Fee reserve</span><strong class="${hasFee ? 'sok' : 'sbad'}">${fmt(bal('SOL'), 4)} / ${FEE_RESERVE_SOL} SOL</strong></div><button class="sbtn" id="stableAction" type="button" ${canTrade ? '' : 'disabled'}>${connected ? isPerp ? 'Open Perp' : `Buy ${output}` : 'Connect wallet'}</button></div>${book(symbol)}`;
  }

  function renderButtons() {
    const address = currentAddress();
    $$('.connectWallet').forEach(btn => {
      btn.textContent = address ? shortAddress(address) : 'Connect';
      btn.classList.toggle('connected', Boolean(address));
    });
  }
  function renderAll() { renderButtons(); renderAccount(); renderPortfolio(); renderPanel(); renderTicket(); }

  document.addEventListener('input', event => {
    const slider = event.target.closest?.('#stablePct');
    const amount = event.target.closest?.('#stableAmount');
    if (slider) { state.pct = Number(slider.value || 0); renderTicket(); }
    if (amount) {
      const row = marketRow();
      const input = marketKind(row) === 'perps' ? 'USDC' : (quote(row?.dataset.symbol) === 'USD' ? 'USDC' : quote(row?.dataset.symbol));
      const max = input === 'SOL' ? Math.max(bal('SOL') - FEE_RESERVE_SOL, 0) : bal(input);
      state.pct = max > 0 ? Math.max(0, Math.min(100, Number(amount.value || 0) / max * 100)) : 0;
      renderTicket();
    }
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest?.('.accountTabs button')) setTimeout(renderPanel, 0);
    if (event.target.closest?.('.marketMain')) setTimeout(() => { state.pct = 0; renderTicket(); }, 80);
    if (event.target.closest?.('#stableAction')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const toast = $('#toast');
      if (toast) { toast.textContent = 'Wallet balances are connected. Real Jupiter execution is the next step.'; toast.classList.add('visible'); setTimeout(() => toast.classList.remove('visible'), 2200); }
    }
  }, true);

  function start() {
    renderAll();
    loadBalances(true);
    setInterval(() => loadBalances(false), 12000);
    window.addEventListener('focus', () => loadBalances(true));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loadBalances(true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
