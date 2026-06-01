(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RPC = 'https://api.mainnet-beta.solana.com';
  const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const MINTS = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoqqwjyGKJnMhxGduzxVT'
  };
  const SOL_RESERVE = 0.06;
  const state = {
    owner: '',
    loading: false,
    loadedAt: 0,
    balances: { SOL: 0, USDC: 0, USDT: 0 },
    percent: 0,
    lastRenderedKey: ''
  };

  const style = document.createElement('style');
  style.textContent = `
    .walletBox{padding:16px 18px}.walletBox p{color:#9db0bb;margin:0;font-size:15px;line-height:1.45}.walletRow{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;border-bottom:1px solid rgba(145,211,239,.14);padding:13px 0}.walletRow:last-child{border-bottom:0}.walletRow p{margin:4px 0 0;color:#9db0bb;font-size:13px}.walletRow h3{margin:0;font-size:18px;font-weight:520}.walletRow strong{text-align:right;font-size:17px;font-weight:430}.walletValue{display:block;color:#9db0bb;font-size:12px;margin-top:3px}.walletSlider{display:grid;grid-template-columns:1fr 54px;gap:12px;align-items:center;margin:13px 0 12px}.walletSlider input[type=range]{width:100%;accent-color:#58caff}.walletSlider strong{height:38px;border:1px solid rgba(145,211,239,.24);border-radius:10px;display:grid;place-items:center;font-weight:430}.ticketBalance b{color:#eef8ff;font-weight:430}.ticketHelp{color:#9db0bb;font-size:12px;line-height:1.35;margin-top:8px}.ticketAction[disabled]{opacity:.52;cursor:not-allowed}.accountSheet.compact .primaryWide{display:none!important}.emptyState button[data-view="markets"]{display:none!important}.amountOut{color:#eef8ff!important}.amountOut input{color:#eef8ff!important}.walletWarn{color:#ff819e!important}.walletOk{color:#75d9ff!important}
  `;
  document.head.appendChild(style);

  function fmt(n, max = 6) { return Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: max }); }
  function usd(n) { return '$' + Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function toast(message) { const t = $('#toast'); if (!t) return; t.textContent = message; t.classList.add('visible'); setTimeout(() => t.classList.remove('visible'), 2400); }
  function textPublicKey(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }
  function providerPublicKey() {
    return textPublicKey(window.phantom?.solana?.publicKey || window.solana?.publicKey || window.solflare?.publicKey || window.backpack?.solana?.publicKey || window.glowSolana?.publicKey || window.okxwallet?.solana?.publicKey || window.okxWallet?.solana?.publicKey);
  }
  function owner() { return localStorage.getItem('shypeWalletPublicKey') || providerPublicKey() || ''; }
  function connected() { return Boolean(owner()) || localStorage.getItem('shypeWalletConnected') === 'true'; }
  function shortAddress(a) { return a ? `${a.slice(0, 4)}…${a.slice(-4)}` : 'Connect'; }
  function parseNum(v) {
    const raw = String(v || '0').replace(/[$€\s]/g, '');
    if (raw.includes(',') && raw.includes('.')) return Number(raw.replace(/\./g, '').replace(',', '.')) || 0;
    if (raw.includes(',')) return Number(raw.replace(',', '.')) || 0;
    return Number(raw.replace(/,/g, '')) || 0;
  }
  function base(symbol) { return String(symbol || '').split(/[/-]/)[0] || 'SOL'; }
  function quote(symbol) { return String(symbol || '').split(/[/-]/)[1] || 'USDC'; }
  function selectedRow() {
    const symbol = $('.marketIdentity strong')?.textContent?.trim() || '';
    return $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`) || $('.marketRow[data-symbol]');
  }
  function rowKind(row) { return row?.dataset.kind || (String(row?.dataset.symbol || '').includes('-') ? 'perps' : 'spot'); }
  function rowPrice(row) {
    if (!row) return 1;
    return parseNum(row.querySelector('.marketLast strong')?.textContent || row.dataset.priceValue || row.dataset.price || '1') || 1;
  }
  function solUsd() {
    const row = $('.marketRow[data-symbol="SOL/USDC"]') || $('.marketRow[data-symbol="SOL/USDT"]');
    return rowPrice(row) || 82;
  }
  function assetUsdPrice(symbol) {
    const b = base(symbol);
    const q = quote(symbol);
    const row = $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`);
    const p = rowPrice(row);
    if (b === 'SOL') return solUsd();
    if (b === 'USDC' || b === 'USDT') return 1;
    if (q === 'SOL') return p * solUsd();
    return p;
  }
  async function rpc(method, params) {
    const res = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'Solana RPC error');
    return json.result;
  }
  async function loadBalances(force = false) {
    const address = owner();
    if (!address) { state.owner = ''; state.balances = { SOL: 0, USDC: 0, USDT: 0 }; renderAll(); return; }
    if (!force && state.loading) return;
    if (!force && state.owner === address && Date.now() - state.loadedAt < 14000) return;
    state.loading = true;
    state.owner = address;
    localStorage.setItem('shypeWalletPublicKey', address);
    try {
      const [lamports, accounts] = await Promise.all([
        rpc('getBalance', [address, { commitment: 'confirmed' }]),
        rpc('getParsedTokenAccountsByOwner', [address, { programId: TOKEN_PROGRAM }, { encoding: 'jsonParsed', commitment: 'confirmed' }])
      ]);
      const next = { SOL: (lamports?.value || 0) / 1e9, USDC: 0, USDT: 0 };
      (accounts?.value || []).forEach(item => {
        const info = item?.account?.data?.parsed?.info;
        const amount = Number(info?.tokenAmount?.uiAmountString || info?.tokenAmount?.uiAmount || 0);
        if (info?.mint === MINTS.USDC) next.USDC += amount;
        if (info?.mint === MINTS.USDT) next.USDT += amount;
      });
      state.balances = next;
      state.loadedAt = Date.now();
      updateConnectLabel();
      renderAll();
    } catch (error) {
      toast('Could not load wallet balances.');
    } finally {
      state.loading = false;
    }
  }
  function updateConnectLabel() {
    const address = owner();
    $$('.connectWallet').forEach(button => {
      if (address) { button.textContent = shortAddress(address); button.classList.add('connected'); }
      else if (localStorage.getItem('shypeWalletConnected') === 'true') { button.textContent = 'Connect'; button.classList.remove('connected'); }
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = address ? `Wallet connected: ${shortAddress(address)}` : 'No wallet connected.';
  }
  function renderBalancesPanel() {
    const list = $('#positionsList');
    if (!list) return;
    const address = owner();
    const solPrice = solUsd();
    if (!address) {
      list.innerHTML = '<div class="walletBox"><p>Connect a wallet from the top right to load live balances.</p></div>';
      return;
    }
    const b = state.balances;
    list.innerHTML = `<div class="walletBox">
      <article class="walletRow"><div><h3>SOL</h3><p>Native asset · ${SOL_RESERVE} SOL kept for fees</p></div><strong>${fmt(b.SOL, 6)}<span class="walletValue">${usd(b.SOL * solPrice)}</span></strong></article>
      <article class="walletRow"><div><h3>USDC</h3><p>Stablecoin balance</p></div><strong>${fmt(b.USDC, 2)}<span class="walletValue">${usd(b.USDC)}</span></strong></article>
      <article class="walletRow"><div><h3>USDT</h3><p>Stablecoin balance</p></div><strong>${fmt(b.USDT, 2)}<span class="walletValue">${usd(b.USDT)}</span></strong></article>
    </div>`;
  }
  function renderPanelContent() {
    const list = $('#positionsList');
    if (!list) return;
    const active = $('.accountTabs button.active')?.textContent?.trim().toLowerCase() || 'positions';
    if (active.includes('balance')) return renderBalancesPanel();
    if (active.includes('open')) list.innerHTML = '<div class="walletBox"><p>No open orders yet.</p></div>';
    if (active.includes('history')) list.innerHTML = '<div class="walletBox"><p>No SHYPE trades yet.</p></div>';
    $$('.emptyState').forEach(e => { if (e.textContent.includes('No open positions')) e.innerHTML = '<span>No open positions</span>'; });
  }
  function ticketKey() {
    const row = selectedRow();
    return `${row?.dataset.symbol || ''}|${rowKind(row)}|${owner()}|${state.percent}|${state.balances.SOL.toFixed(6)}|${state.balances.USDC.toFixed(2)}|${state.balances.USDT.toFixed(2)}`;
  }
  function renderTicket(force = false) {
    const ticket = $('.tradeTicket');
    const row = selectedRow();
    if (!ticket || !row) return;
    const key = ticketKey();
    if (!force && ticket.dataset.walletKey === key) return;
    ticket.dataset.walletKey = key;
    const symbol = row.dataset.symbol || 'SOL/USDC';
    const kind = rowKind(row);
    const b = base(symbol);
    const q = quote(symbol);
    const isPerp = kind === 'perps';
    const from = isPerp ? 'USDC' : (b === 'SOL' ? (state.balances.USDC > 0 ? 'USDC' : 'USDT') : 'SOL');
    const available = from === 'SOL' ? Math.max(state.balances.SOL - SOL_RESERVE, 0) : state.balances[from];
    const spend = Math.max(0, available * state.percent / 100);
    const bUsd = assetUsdPrice(symbol);
    const fromUsd = from === 'SOL' ? solUsd() : 1;
    const receive = isPerp ? spend : (spend * fromUsd / Math.max(bUsd, 0.000001));
    const address = owner();
    const canTrade = Boolean(address) && (from !== 'SOL' || state.balances.SOL > SOL_RESERVE) && spend > 0;
    const reserveText = from === 'SOL' ? `${SOL_RESERVE} SOL fee reserve kept` : `SOL fee reserve: ${fmt(state.balances.SOL, 4)} / ${SOL_RESERVE}`;
    ticket.innerHTML = `<div class="ticketForm">
      <div class="ticketTopControls"><button type="button">${isPerp ? 'Market' : 'Swap'}⌄</button><button type="button">Exact In⌄</button><button type="button">${from}⌄</button></div>
      ${isPerp ? '<div class="sideTabs"><button class="active" type="button">Buy / Long</button><button type="button">Sell / Short</button></div>' : ''}
      <div class="ticketBalance"><span>Available</span><b>${address ? `${fmt(available, from === 'SOL' ? 6 : 2)} ${from}` : 'Connect wallet'}</b></div>
      <div class="spotRouteLine"><span>From</span><strong>${from}</strong></div>
      <label class="compactInput"><input id="tradeAmountWallet" type="number" inputmode="decimal" min="0" step="0.000001" value="${spend ? spend.toFixed(from === 'SOL' ? 6 : 2) : '0'}" /><em>${from}</em></label>
      <div class="walletSlider"><input id="walletPercent" type="range" min="0" max="100" step="1" value="${state.percent}" /><strong>${Math.round(state.percent)}%</strong></div>
      <div class="spotRouteLine"><span>${isPerp ? 'Position value' : 'To'}</span><strong>${isPerp ? 'USDC' : b}</strong></div>
      <label class="compactInput amountOut"><input type="text" value="≈ ${fmt(receive, b === 'BTC' ? 6 : 4)}" readonly /><em>${isPerp ? 'notional' : b}</em></label>
      <div class="ticketMetric"><span>Route</span><strong>${isPerp ? `Jupiter Perps · ${row.dataset.badge || '20x'}` : `Jupiter · ${from}/${b}`}</strong></div>
      <div class="ticketMetric"><span>Slippage</span><strong class="walletOk">0,5%</strong></div>
      <p class="ticketHelp ${from !== 'SOL' && state.balances.SOL < SOL_RESERVE ? 'walletWarn' : ''}">${reserveText}</p>
      <button class="ticketAction secondary" type="button" id="walletPreviewButton" ${canTrade ? '' : 'disabled'}>${address ? (isPerp ? 'Preview Perp' : 'Preview Swap') : 'Connect wallet'}</button>
    </div>`;
  }
  function renderAccount() {
    const sheet = $('.appView[data-panel="account"] .accountSheet');
    if (!sheet) return;
    const address = owner();
    const b = state.balances;
    if (!address) return;
    sheet.innerHTML = `<h2>Wallet</h2><p class="walletStatusText">Wallet connected: ${shortAddress(address)}</p><div class="walletRow"><div><h3>SOL</h3><p>Native balance</p></div><strong>${fmt(b.SOL, 6)}</strong></div><div class="walletRow"><div><h3>USDC</h3><p>Stablecoin</p></div><strong>${fmt(b.USDC, 2)}</strong></div><div class="walletRow"><div><h3>USDT</h3><p>Stablecoin</p></div><strong>${fmt(b.USDT, 2)}</strong></div>`;
  }
  function renderAll() { updateConnectLabel(); renderPanelContent(); renderTicket(); renderAccount(); }

  document.addEventListener('input', event => {
    const slider = event.target.closest?.('#walletPercent');
    const amount = event.target.closest?.('#tradeAmountWallet');
    if (slider) { state.percent = Number(slider.value || 0); renderTicket(true); }
    if (amount) {
      const row = selectedRow(); if (!row) return;
      const symbol = row.dataset.symbol || '';
      const from = rowKind(row) === 'perps' ? 'USDC' : (base(symbol) === 'SOL' ? (state.balances.USDC > 0 ? 'USDC' : 'USDT') : 'SOL');
      const max = from === 'SOL' ? Math.max(state.balances.SOL - SOL_RESERVE, 0) : state.balances[from];
      state.percent = max > 0 ? Math.max(0, Math.min(100, (Number(amount.value || 0) / max) * 100)) : 0;
      renderTicket(true);
    }
  }, true);
  document.addEventListener('click', event => {
    if (event.target.closest?.('.accountTabs button')) setTimeout(renderPanelContent, 0);
    if (event.target.closest?.('#walletPreviewButton')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!owner()) return toast('Connect wallet first.');
      toast('Balance check ready. Jupiter execution is the next build step.');
    }
  }, true);
  window.addEventListener('shype:wallet-connected', () => loadBalances(true));
  setInterval(() => loadBalances(false), 12000);
  setInterval(() => renderAll(), 1200);
  setTimeout(() => loadBalances(true), 650);
})();