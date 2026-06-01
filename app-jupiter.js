(() => {
  const MINTS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KiLv4nccBRBn24Ttr4evXF',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL4QM92QJN'
  };
  const DECIMALS = { SOL: 9, USDC: 6, USDT: 6, JUP: 6, WIF: 6, BTC: 6, ETH: 8, HYPE: 6 };
  const state = { tokenMap: new Map(), wallet: null, activeTab: 'Positions', pending: null };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function toast(message) {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('visible');
    setTimeout(() => node.classList.remove('visible'), 2800);
  }
  function splitSymbol(symbol) { return String(symbol || 'SOL/USDC').split(/[/-]/); }
  function baseAsset(symbol) { return splitSymbol(symbol)[0] || 'SOL'; }
  function quoteAsset(symbol) { return splitSymbol(symbol)[1] || 'USDC'; }
  function selectedSymbol() { return $('.marketIdentity strong')?.textContent?.trim() || 'SOL/USDC'; }
  function selectedKind() { return selectedSymbol().includes('-') ? 'perps' : 'spot'; }
  function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function fmtUsd(value) {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (Math.abs(n) >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
  }
  function fmtToken(value) {
    return Number(value || 0).toLocaleString('de-DE', { maximumFractionDigits: 8 });
  }
  function marketPrice(symbol = selectedSymbol()) {
    let row = null;
    try { row = $(`.marketRow[data-symbol="${CSS.escape(symbol)}"]`); } catch {}
    const text = row?.querySelector('.marketLast strong')?.textContent || $('.marketNumbers strong')?.textContent || row?.dataset.priceValue || '0';
    return Number(String(text).replace(/[$€\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  }
  function shortKey(key) { return key ? `${key.slice(0, 4)}…${key.slice(-4)}` : 'Connect'; }

  async function loadTokens() {
    Object.entries(MINTS).forEach(([symbol, mint]) => state.tokenMap.set(symbol, { symbol, mint, decimals: DECIMALS[symbol] || 6 }));
    try {
      const response = await fetch('https://tokens.jup.ag/strict', { cache: 'force-cache' });
      const list = await response.json();
      if (Array.isArray(list)) {
        list.forEach(token => {
          if (!token.symbol || !token.address) return;
          if (!state.tokenMap.has(token.symbol)) {
            state.tokenMap.set(token.symbol, { symbol: token.symbol, mint: token.address, decimals: Number(token.decimals || 6) });
          }
        });
      }
    } catch {}
  }

  function token(symbol) { return state.tokenMap.get(String(symbol).toUpperCase()) || null; }
  function amountToRaw(amount, decimals) { return String(Math.max(0, Math.round(Number(amount || 0) * 10 ** decimals))); }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.Jupiter) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  async function ensureJupiter() {
    if (window.Jupiter) return;
    try { await loadScript('https://terminal.jup.ag/main-v4.js'); }
    catch { await loadScript('https://terminal.jup.ag/main-v3.js'); }
  }

  async function connectWallet() {
    if (window.solana?.isPhantom) {
      const result = await window.solana.connect({ onlyIfTrusted: false });
      state.wallet = result.publicKey?.toString?.() || String(result.publicKey || '');
      localStorage.setItem('shypeWalletConnected', 'true');
      updateWalletUi();
      renderAccount('Balances');
      return state.wallet;
    }
    toast('Open SHYPE in Phantom Browser or install Phantom to connect.');
    return null;
  }

  function updateWalletUi() {
    const label = state.wallet ? shortKey(state.wallet) : 'Connect';
    $$('.connectWallet, .accountSheet .primaryWide').forEach(btn => {
      if (btn.hasAttribute('data-view')) return;
      btn.textContent = label;
      btn.classList.toggle('connected', Boolean(state.wallet));
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = state.wallet ? `Connected: ${state.wallet}` : 'No wallet connected.';
  }

  function addHistory(entry) {
    const history = readJson('shypeOrderHistory', []);
    history.unshift(entry);
    writeJson('shypeOrderHistory', history.slice(0, 80));
  }
  function addPosition(entry) {
    const positions = readJson('shypeSpotPositions', []);
    positions.unshift(entry);
    writeJson('shypeSpotPositions', positions);
  }

  function renderBalances() {
    if (!state.wallet) return '<div class="emptyState"><span>Connect wallet to view balances</span><button type="button" data-wallet-connect>Connect</button></div>';
    return '<div class="emptyState"><span>Balances are handled by Jupiter during swap. Wallet RPC balance view comes next.</span><button type="button" data-shype-open-swap>Open swap</button></div>';
  }
  function renderPositions() {
    const positions = readJson('shypeSpotPositions', []);
    if (!positions.length) return '<div class="emptyState"><span>No open positions</span><button type="button" data-view="markets">Choose market</button></div>';
    const closeAll = positions.length > 1 ? '<div class="positionTools"><button type="button" data-close-all-local>Close all positions</button></div>' : '';
    return closeAll + positions.map(p => {
      const now = marketPrice(p.symbol) || p.entry;
      const pnl = (now - p.entry) * p.amount;
      const pct = p.entry ? ((now - p.entry) / p.entry) * 100 : 0;
      return `<article class="positionRow"><div><h3>${p.symbol}<span class="kindPill">SPOT</span></h3><p>${fmtToken(p.amount)} ${p.base} · Entry ${fmtUsd(p.entry)} · Now ${fmtUsd(now)}</p></div><div class="positionPnl"><strong class="${pnl < 0 ? 'down' : ''}">${fmtUsd(pnl)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)</strong><button type="button" data-close-local-position="${p.id}">Close</button></div></article>`;
    }).join('');
  }
  function renderOpenOrders() {
    return state.pending ? `<article class="positionRow"><div><h3>${state.pending.symbol}<span class="kindPill">SPOT</span></h3><p>${state.pending.status}</p></div><div class="positionPnl"><strong>Pending</strong></div></article>` : '<div class="emptyState"><span>No open orders</span><button type="button" data-view="markets">Choose market</button></div>';
  }
  function renderHistory() {
    const history = readJson('shypeOrderHistory', []);
    if (!history.length) return '<div class="emptyState"><span>No order history yet</span><button type="button" data-view="markets">Choose market</button></div>';
    return history.map(h => `<article class="positionRow"><div><h3>${h.symbol}<span class="kindPill">${h.side}</span></h3><p>${new Date(h.time).toLocaleString()}${h.txid ? ` · ${h.txid.slice(0, 6)}…${h.txid.slice(-6)}` : ''}</p></div><div class="positionPnl"><strong>${h.status}</strong></div></article>`).join('');
  }
  function renderAccount(tab = state.activeTab) {
    state.activeTab = tab;
    $$('.accountTabs button').forEach(btn => btn.classList.toggle('active', btn.textContent.trim() === tab));
    const list = $('#positionsList');
    if (!list) return;
    if (tab === 'Balances') list.innerHTML = renderBalances();
    else if (tab === 'Open Orders') list.innerHTML = renderOpenOrders();
    else if (tab === 'History') list.innerHTML = renderHistory();
    else list.innerHTML = renderPositions();
  }

  async function openJupiterSwap() {
    const symbol = selectedSymbol();
    if (selectedKind() !== 'spot') {
      toast('Perps are still UI-only. Spot swaps are connected first.');
      return;
    }
    const base = baseAsset(symbol);
    const quote = quoteAsset(symbol);
    const outputToken = token(base);
    const inputToken = token(quote) || token('SOL');
    if (!outputToken || !inputToken) {
      toast(`Token mint missing for ${symbol}.`);
      return;
    }
    const amount = Number($('#tradeAmount')?.value || 1) || 1;
    state.pending = { symbol, status: 'Jupiter swap opened' };
    renderAccount('Open Orders');
    await ensureJupiter();
    const onSuccess = (result = {}) => {
      const txid = result.txid || result.signature || result?.swapResult?.txid || '';
      const entry = marketPrice(symbol) || 0;
      const estimatedOut = entry > 0 ? amount / entry : 0;
      addPosition({ id: Date.now(), symbol, base, quote, amount: estimatedOut, entry, txid, openedAt: new Date().toISOString() });
      addHistory({ id: Date.now(), symbol, side: 'Buy', status: 'Confirmed', txid, time: new Date().toISOString() });
      state.pending = null;
      renderAccount('Positions');
      toast('Swap confirmed and tracked.');
    };
    const onSwapError = () => {
      state.pending = null;
      renderAccount('Open Orders');
      toast('Swap cancelled or failed.');
    };
    window.Jupiter.init({
      displayMode: 'modal',
      endpoint: 'https://api.mainnet-beta.solana.com',
      strictTokenList: false,
      defaultExplorer: 'Solscan',
      formProps: {
        initialInputMint: inputToken.mint,
        initialOutputMint: outputToken.mint,
        initialAmount: amountToRaw(amount, inputToken.decimals),
        swapMode: 'ExactIn'
      },
      onSuccess,
      onSwapError
    });
    if (window.Jupiter.resume) window.Jupiter.resume();
    if (window.Jupiter.show) window.Jupiter.show();
  }

  function closeLocalPosition(id) {
    const positions = readJson('shypeSpotPositions', []);
    const item = positions.find(p => p.id === id);
    if (item) addHistory({ id: Date.now(), symbol: item.symbol, side: 'Close', status: 'Local close', txid: '', time: new Date().toISOString() });
    writeJson('shypeSpotPositions', positions.filter(p => p.id !== id));
    renderAccount('Positions');
  }

  function bind() {
    document.addEventListener('click', async event => {
      const wallet = event.target.closest('[data-wallet-connect], .connectWallet, .accountSheet .primaryWide');
      if (wallet && !wallet.hasAttribute('data-view')) { event.preventDefault(); event.stopPropagation(); await connectWallet(); return; }
      const swap = event.target.closest('[data-open-demo], [data-shype-open-swap]');
      if (swap) { event.preventDefault(); event.stopPropagation(); await openJupiterSwap(); return; }
      const tab = event.target.closest('.accountTabs button');
      if (tab) { event.preventDefault(); renderAccount(tab.textContent.trim()); return; }
      const close = event.target.closest('[data-close-local-position]');
      if (close) { event.preventDefault(); closeLocalPosition(Number(close.dataset.closeLocalPosition)); return; }
      const closeAll = event.target.closest('[data-close-all-local]');
      if (closeAll) { event.preventDefault(); writeJson('shypeSpotPositions', []); renderAccount('Positions'); return; }
    }, true);
  }

  async function init() {
    bind();
    await loadTokens();
    if (window.solana?.isPhantom && localStorage.getItem('shypeWalletConnected') === 'true') {
      try {
        const result = await window.solana.connect({ onlyIfTrusted: true });
        state.wallet = result.publicKey?.toString?.() || String(result.publicKey || '');
      } catch {}
    }
    updateWalletUi();
    renderAccount('Positions');
    setInterval(() => renderAccount(state.activeTab), 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();