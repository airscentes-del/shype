(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SOL_RESERVE = 0.06;
  const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const RPCS = [
    'https://solana-rpc.publicnode.com',
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana'
  ];
  const COMMON = {
    So11111111111111111111111111111111111111112: { symbol: 'SOL', name: 'Solana', decimals: 9, price: 82 },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1 },
    Es9vMFrzaCERmJfrF4H2FYD4KCoqqwjyGKJnMhxGduzxVT: { symbol: 'USDT', name: 'Tether USD', decimals: 6, price: 1 },
    JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
    DezXAZ8z7PnrnRJjz3V7TgzvKaJ7w5Cix4YF6B263263: { symbol: 'BONK', name: 'Bonk', decimals: 5 },
    EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL2CkGeGSKhqw: { symbol: 'WIF', name: 'dogwifhat', decimals: 6 }
  };
  const state = { owner: '', tokens: [], balances: {}, percent: 0, loading: false, error: '', lastLoad: 0, lastTicket: '', localHistory: [] };

  const style = document.createElement('style');
  style.textContent = `
    .ticketAction[data-open-demo],button[data-open-demo]{display:none!important;pointer-events:none!important}.tradeTicket.proTicket .ticketAction{display:block!important;pointer-events:auto!important}
    .walletBox{padding:15px 18px}.walletBox p{margin:0;color:#9db0bb;font-size:14px;line-height:1.45}.walletList{border:1px solid rgba(145,211,239,.18);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.012)}
    .walletRow{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:13px 14px;border-bottom:1px solid rgba(145,211,239,.13)}.walletRow:last-child{border-bottom:0}.walletRow h3{margin:0;color:#eef8ff;font-size:17px;font-weight:520;letter-spacing:-.02em}.walletRow p{margin:3px 0 0;color:#91a5b0;font-size:12px}.walletRow strong{text-align:right;color:#eef8ff;font-size:17px;font-weight:430}.walletValue{display:block;margin-top:3px;color:#91a5b0;font-size:12px}.walletMint{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.walletError{color:#ff819e!important}.walletOk{color:#58caff!important}.walletSmall{font-size:12px;color:#91a5b0;margin-top:10px!important}
    .walletSlider{display:grid;grid-template-columns:1fr 54px;gap:12px;align-items:center;margin:12px 0}.walletSlider input[type=range]{width:100%;accent-color:#58caff}.walletSlider strong{height:37px;border:1px solid rgba(145,211,239,.24);border-radius:10px;display:grid;place-items:center;font-size:14px;font-weight:430}.ticketBalance b{color:#eef8ff;font-weight:430}.ticketHelp{color:#9db0bb;font-size:12px;line-height:1.35;margin-top:8px}.ticketAction[disabled]{opacity:.48;cursor:not-allowed}.amountOut input{color:#eef8ff!important}.accountSheet.compact .primaryWide{display:none!important}.emptyState button[data-view="markets"]{display:none!important}.accountSheet .walletRow{border-bottom:1px solid rgba(145,211,239,.14)}
  `;
  document.head.appendChild(style);

  const fmt = (n, max = 6) => Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: max });
  const usd = n => '$' + Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const short = a => a ? `${a.slice(0, 4)}…${a.slice(-4)}` : 'Connect';
  const validAddress = a => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(a || ''));
  const mintShort = a => a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '';
  const toast = msg => { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('visible'); setTimeout(() => t.classList.remove('visible'), 2400); };

  function textKey(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }
  function providerKey() {
    return textKey(window.phantom?.solana?.publicKey || window.solana?.publicKey || window.solflare?.publicKey || window.backpack?.solana?.publicKey || window.glowSolana?.publicKey || window.okxwallet?.solana?.publicKey || window.okxWallet?.solana?.publicKey);
  }
  function owner() {
    const saved = localStorage.getItem('shypeWalletPublicKey') || '';
    if (validAddress(saved)) return saved;
    if (saved) localStorage.removeItem('shypeWalletPublicKey');
    const injected = providerKey();
    if (validAddress(injected)) {
      localStorage.setItem('shypeWalletPublicKey', injected);
      localStorage.setItem('shypeWalletConnected', 'true');
      return injected;
    }
    return '';
  }
  function parseNum(v) {
    const raw = String(v || '0').replace(/[$€\s]/g, '');
    if (raw.includes(',') && raw.includes('.')) return Number(raw.replace(/\./g, '').replace(',', '.')) || 0;
    if (raw.includes(',')) return Number(raw.replace(',', '.')) || 0;
    return Number(raw.replace(/,/g, '')) || 0;
  }
  const base = symbol => String(symbol || '').split(/[/-]/)[0] || 'SOL';
  const quote = symbol => String(symbol || '').split(/[/-]/)[1] || 'USDC';
  function selectedRow() {
    const symbol = $('.marketIdentity strong')?.textContent?.trim() || '';
    return $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`) || $('.marketRow[data-symbol]');
  }
  function rowKind(row) { return row?.dataset.kind || (String(row?.dataset.symbol || '').includes('-') ? 'perps' : 'spot'); }
  function rowPrice(row) { return parseNum(row?.querySelector('.marketLast strong')?.textContent || row?.dataset.priceValue || '1') || 1; }
  function solUsd() { return rowPrice($('.marketRow[data-symbol="SOL/USDC"]') || $('.marketRow[data-symbol="SOL/USDT"]')) || 82; }
  function assetUsdPrice(symbol) {
    const b = base(symbol), q = quote(symbol);
    if (b === 'SOL') return solUsd();
    if (b === 'USDC' || b === 'USDT') return 1;
    const exact = $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`);
    const p = rowPrice(exact);
    if (q === 'SOL') return p * solUsd();
    if (q === 'USDC' || q === 'USDT' || q === 'USD') return p;
    return 0;
  }
  function balanceOf(symbolOrMint) {
    if (!symbolOrMint) return 0;
    if (state.balances[symbolOrMint] != null) return state.balances[symbolOrMint];
    const token = state.tokens.find(t => t.symbol === symbolOrMint || t.mint === symbolOrMint);
    return token?.amount || 0;
  }

  async function rpc(method, params) {
    let last;
    for (const url of RPCS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }), signal: controller.signal });
        clearTimeout(timer);
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || 'RPC error');
        return json.result;
      } catch (e) { last = e; }
    }
    throw last || new Error('RPC failed');
  }
  async function loadBalances(force = false) {
    const address = owner();
    if (!address) { state.owner = ''; state.tokens = []; state.balances = {}; state.error = ''; renderAll(true); return; }
    if (state.loading) return;
    if (!force && state.owner === address && Date.now() - state.lastLoad < 15000) return;
    state.loading = true; state.owner = address; state.error = '';
    try {
      const [solResult, tokenResult] = await Promise.all([
        rpc('getBalance', [address, { commitment: 'confirmed' }]),
        rpc('getParsedTokenAccountsByOwner', [address, { programId: TOKEN_PROGRAM }, { encoding: 'jsonParsed', commitment: 'confirmed' }])
      ]);
      const tokens = [];
      const balances = {};
      const solAmount = (solResult?.value || 0) / 1e9;
      tokens.push({ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', amount: solAmount, decimals: 9, price: solUsd() });
      balances.SOL = solAmount;
      (tokenResult?.value || []).forEach(item => {
        const info = item?.account?.data?.parsed?.info;
        const amount = Number(info?.tokenAmount?.uiAmountString || info?.tokenAmount?.uiAmount || 0);
        if (!info?.mint || amount <= 0) return;
        const meta = COMMON[info.mint] || {};
        const symbol = meta.symbol || mintShort(info.mint);
        const name = meta.name || 'Solana token';
        tokens.push({ mint: info.mint, symbol, name, amount, decimals: Number(info?.tokenAmount?.decimals || meta.decimals || 0), price: meta.price || 0 });
        balances[symbol] = (balances[symbol] || 0) + amount;
        balances[info.mint] = (balances[info.mint] || 0) + amount;
      });
      state.tokens = tokens.sort((a, b) => (b.symbol === 'SOL') - (a.symbol === 'SOL') || a.symbol.localeCompare(b.symbol));
      state.balances = balances;
      state.lastLoad = Date.now();
      renderAll(true);
    } catch (e) {
      state.error = 'Could not load wallet balances.';
      renderAll(true);
      toast(state.error);
    } finally { state.loading = false; }
  }

  function updateConnectLabel() {
    const address = owner();
    $$('.connectWallet').forEach(button => {
      if (address) { button.textContent = short(address); button.classList.add('connected'); }
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = address ? `Wallet connected: ${short(address)}` : 'No wallet connected.';
  }
  function tokenUsd(token) {
    const row = $(`.marketRow[data-symbol^="${CSS.escape(token.symbol)}/"]`);
    const price = token.price || (row ? assetUsdPrice(row.dataset.symbol) : 0);
    return price ? token.amount * price : 0;
  }
  function tokenRows() {
    if (!owner()) return '<p>Connect wallet to load all tokens.</p>';
    if (state.loading && !state.tokens.length) return '<p>Loading wallet balances…</p>';
    if (state.error && !state.tokens.length) return `<p class="walletError">${state.error}</p><p class="walletSmall">Try opening SHYPE inside your wallet browser again, then refresh.</p>`;
    if (!state.tokens.length) return '<p>No token balances found.</p>';
    return `<div class="walletList">${state.tokens.map(t => `<article class="walletRow"><div><h3>${t.symbol}</h3><p>${t.name}${t.symbol === 'SOL' ? ` · ${SOL_RESERVE} SOL fee reserve` : ''}</p></div><strong>${fmt(t.amount, t.amount < 1 ? 6 : 4)}<span class="walletValue">${tokenUsd(t) ? usd(tokenUsd(t)) : `<span class="walletMint">${mintShort(t.mint)}</span>`}</span></strong></article>`).join('')}</div>`;
  }
  function activeAccountTab() { return $('.accountTabs button.active')?.textContent?.trim().toLowerCase() || 'positions'; }
  function renderPanel() {
    const list = $('#positionsList'); if (!list) return;
    const tab = activeAccountTab();
    if (tab.includes('balance')) list.innerHTML = `<div class="walletBox">${tokenRows()}</div>`;
    else if (tab.includes('open')) list.innerHTML = '<div class="walletBox"><p>No open orders yet. Orders created through SHYPE will appear here.</p></div>';
    else if (tab.includes('history')) list.innerHTML = `<div class="walletBox">${state.localHistory.length ? state.localHistory.map(h => `<article class="walletRow"><div><h3>${h.symbol}</h3><p>${h.type} · ${h.time}</p></div><strong>${h.amount}</strong></article>`).join('') : '<p>No SHYPE trades yet.</p>'}</div>`;
    else $$('.emptyState').forEach(e => { if (e.textContent.includes('No open positions')) e.innerHTML = '<span>No open positions</span>'; });
  }
  function miniBook() {
    const old = $('.miniOrderBook');
    return old ? old.outerHTML : '';
  }
  function renderTicket(force = false) {
    const ticket = $('.tradeTicket'); const row = selectedRow(); if (!ticket || !row) return;
    const symbol = row.dataset.symbol || 'SOL/USDC'; const kind = rowKind(row); const isPerp = kind === 'perps'; const b = base(symbol); const q = quote(symbol);
    const key = `${symbol}|${kind}|${owner()}|${state.percent}|${JSON.stringify(state.balances)}|${ticket.querySelector('#walletPercent') ? 'ok' : 'missing'}`;
    if (!force && ticket.dataset.liveWalletKey === key && ticket.querySelector('#walletPercent')) return;
    ticket.dataset.liveWalletKey = key;
    ticket.classList.add('proTicket');
    const from = isPerp ? 'USDC' : (q === 'USD' ? 'USDC' : q);
    const availableRaw = balanceOf(from);
    const available = from === 'SOL' ? Math.max(availableRaw - SOL_RESERVE, 0) : availableRaw;
    const spend = Math.max(0, available * state.percent / 100);
    const fromUsd = from === 'SOL' ? solUsd() : 1;
    const toUsd = assetUsdPrice(symbol) || rowPrice(row);
    const receive = isPerp ? spend : spend * fromUsd / Math.max(toUsd, 0.0000001);
    const address = owner();
    const enoughFees = from === 'SOL' ? availableRaw > SOL_RESERVE : balanceOf('SOL') >= SOL_RESERVE;
    const canTrade = Boolean(address && enoughFees && spend > 0);
    const book = miniBook();
    ticket.innerHTML = `<div class="ticketForm">
      <div class="ticketTopControls"><button type="button">${isPerp ? 'Market' : 'Swap'}⌄</button><button type="button">Exact In⌄</button><button type="button">${from}⌄</button></div>
      ${isPerp ? '<div class="sideTabs"><button class="active" type="button">Buy / Long</button><button type="button">Sell / Short</button></div>' : ''}
      <div class="ticketBalance"><span>Available</span><b>${address ? `${fmt(available, from === 'SOL' ? 6 : 4)} ${from}` : 'Connect wallet'}</b></div>
      <div class="spotRouteLine"><span>From</span><strong>${from}</strong></div>
      <label class="compactInput"><input id="tradeAmountWallet" type="number" inputmode="decimal" min="0" step="0.000001" value="${spend ? spend.toFixed(from === 'SOL' ? 6 : 4) : '0'}" /><em>${from}</em></label>
      <div class="walletSlider"><input id="walletPercent" type="range" min="0" max="100" step="1" value="${state.percent}" /><strong>${Math.round(state.percent)}%</strong></div>
      <div class="spotRouteLine"><span>${isPerp ? 'Position value' : 'To'}</span><strong>${isPerp ? 'USDC' : b}</strong></div>
      <label class="compactInput amountOut"><input type="text" value="≈ ${fmt(receive, b === 'BTC' ? 6 : 4)}" readonly /><em>${isPerp ? 'notional' : b}</em></label>
      <div class="ticketMetric"><span>Route</span><strong>${isPerp ? `Jupiter Perps · ${row.dataset.badge || '20x'}` : `Jupiter · ${from}/${b}`}</strong></div>
      <div class="ticketMetric"><span>Fee reserve</span><strong class="${enoughFees ? 'walletOk' : 'walletError'}">${fmt(balanceOf('SOL'), 4)} / ${SOL_RESERVE} SOL</strong></div>
      <button class="ticketAction secondary" type="button" id="walletPreviewButton" ${canTrade ? '' : 'disabled'}>${address ? (isPerp ? 'Open Perp' : `Buy ${b}`) : 'Connect wallet'}</button>
    </div>${book}`;
  }
  function renderAccount() {
    const sheet = $('.appView[data-panel="account"] .accountSheet'); if (!sheet) return;
    const address = owner();
    if (!address) return;
    sheet.classList.remove('compact');
    sheet.innerHTML = `<h2>Wallet</h2><p class="walletStatusText">Wallet connected: ${short(address)}</p>${tokenRows()}`;
  }
  function renderPortfolio() {
    const head = $('.appView[data-panel="portfolio"] .pageHead p'); if (head) head.textContent = 'Live wallet tokens and SHYPE positions.';
    const sheet = $('.appView[data-panel="portfolio"] .accountSheet'); if (!sheet) return;
    const spotValue = state.tokens.reduce((sum, token) => sum + tokenUsd(token), 0);
    sheet.innerHTML = `<h2>Portfolio</h2><div><span>Known token value</span><strong>${usd(spotValue)}</strong></div><div><span>Tokens</span><strong>${state.tokens.length}</strong></div><hr /><h2>Wallet assets</h2>${tokenRows()}`;
  }
  function renderAll(force = false) { updateConnectLabel(); renderPanel(); renderTicket(force); renderAccount(); renderPortfolio(); }

  document.addEventListener('input', e => {
    const slider = e.target.closest?.('#walletPercent'); const amount = e.target.closest?.('#tradeAmountWallet');
    if (slider) { state.percent = Number(slider.value || 0); renderTicket(true); }
    if (amount) {
      const row = selectedRow(); if (!row) return; const symbol = row.dataset.symbol || ''; const from = rowKind(row) === 'perps' ? 'USDC' : (quote(symbol) === 'USD' ? 'USDC' : quote(symbol));
      const max = from === 'SOL' ? Math.max(balanceOf('SOL') - SOL_RESERVE, 0) : balanceOf(from);
      state.percent = max > 0 ? Math.max(0, Math.min(100, Number(amount.value || 0) / max * 100)) : 0;
      renderTicket(true);
    }
  }, true);
  document.addEventListener('click', e => {
    if (e.target.closest?.('.accountTabs button')) setTimeout(() => renderPanel(), 0);
    const btn = e.target.closest?.('#walletPreviewButton');
    if (btn) { e.preventDefault(); e.stopImmediatePropagation(); if (!owner()) return toast('Connect wallet first.'); toast('Ready for Jupiter execution step.'); }
  }, true);
  window.addEventListener('shype:wallet-connected', () => loadBalances(true));
  new MutationObserver(() => renderTicket(false)).observe(document.body, { childList: true, subtree: true });
  setInterval(() => loadBalances(false), 15000);
  setInterval(() => renderAll(false), 700);
  setTimeout(() => loadBalances(true), 350);
})();