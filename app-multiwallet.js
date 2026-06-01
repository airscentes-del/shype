(() => {
  const TOKENS = {
    SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
    USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
    USDT: { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KiLv4nccBRBn24Ttr4evXF', decimals: 6 },
    JUP: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
    WIF: { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL4QM92QJN', decimals: 6 }
  };

  const state = { address: '', name: '', provider: null, wallets: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const css = document.createElement('style');
  css.textContent = `
    .mwOverlay{position:fixed;inset:0;z-index:2147483500;background:rgba(0,5,10,.68);backdrop-filter:blur(14px);display:none;align-items:flex-end;justify-content:center;padding:18px}.mwOverlay.open{display:flex}.mwBox{width:min(100%,430px);max-height:78vh;overflow:auto;border:1px solid rgba(145,211,239,.24);border-radius:22px;background:#071722;color:#eef8ff;box-shadow:0 24px 80px rgba(0,0,0,.52)}.mwHead{display:flex;justify-content:space-between;gap:20px;padding:20px;border-bottom:1px solid rgba(145,211,239,.14)}.mwHead h2{margin:0;font-size:22px;font-weight:520;letter-spacing:-.04em}.mwHead p{margin:6px 0 0;color:#9db0bb;font-size:14px;line-height:1.35}.mwClose{width:34px;height:34px;border-radius:10px;border:1px solid rgba(145,211,239,.18);background:rgba(255,255,255,.03);color:#cbd7de;font-size:23px}.mwList{display:grid;gap:8px;padding:14px}.mwOption{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;width:100%;min-height:64px;border:1px solid rgba(145,211,239,.13);border-radius:15px;background:rgba(255,255,255,.025);color:#eef8ff;text-align:left;padding:10px 12px}.mwIcon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(115,232,255,.22),rgba(130,92,255,.14));font-weight:650;color:#8ee8ff;overflow:hidden}.mwIcon img{width:100%;height:100%;object-fit:cover}.mwName{display:block;font-size:16px;font-weight:520}.mwMeta{display:block;margin-top:3px;font-size:12px;color:#9db0bb}.mwPill{font-size:12px;color:#75d9ff;border:1px solid rgba(91,202,255,.3);border-radius:999px;padding:5px 9px}.mwEmpty{padding:18px 20px 22px;color:#9db0bb;font-size:14px;line-height:1.45}.connectWallet.connected{font-size:16px;letter-spacing:-.02em}@media(min-width:720px){.mwOverlay{align-items:center}.mwBox{border-radius:22px}}
  `;
  document.head.appendChild(css);

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2600);
  }

  function shortKey(key) { return key ? `${key.slice(0, 4)}…${key.slice(-4)}` : 'Connect'; }
  function addr(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v.toBase58 === 'function') return v.toBase58();
    if (typeof v.toString === 'function') return v.toString();
    return '';
  }
  function parts(symbol) { return String(symbol || 'SOL/USDC').split(/[/-]/); }
  function symbol() { return $('.marketIdentity strong')?.textContent?.trim() || 'SOL/USDC'; }
  function isSpot() { return symbol().includes('/'); }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  function standardWallets() {
    const found = [];
    const add = wallet => {
      if (!wallet?.name || found.some(w => w.name === wallet.name)) return;
      if (!wallet.features?.['standard:connect']) return;
      const chains = wallet.chains || [];
      if (chains.length && !chains.some(c => String(c).startsWith('solana:'))) return;
      found.push({ name: wallet.name, type: 'standard', wallet, icon: wallet.icon });
    };
    try {
      const api = { register: (...wallets) => wallets.forEach(add) };
      window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }));
      window.addEventListener('wallet-standard:register-wallet', e => { try { e.detail(api); } catch {} });
    } catch {}
    try {
      const w = navigator.wallets;
      if (Array.isArray(w)) w.forEach(add);
      if (typeof w?.get === 'function') w.get().forEach(add);
    } catch {}
    return found;
  }

  function discover() {
    const list = [];
    const add = item => { if (item?.name && item.provider && !list.some(w => w.name === item.name)) list.push(item); };
    add({ name: 'Phantom', type: 'legacy', provider: window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null) });
    add({ name: 'Solflare', type: 'legacy', provider: window.solflare || (window.solana?.isSolflare ? window.solana : null) });
    add({ name: 'Backpack', type: 'legacy', provider: window.backpack?.solana || (window.solana?.isBackpack ? window.solana : null) });
    add({ name: 'Glow', type: 'legacy', provider: window.glowSolana || (window.solana?.isGlow ? window.solana : null) });
    add({ name: 'Exodus', type: 'legacy', provider: window.exodus?.solana });
    add({ name: 'OKX Wallet', type: 'legacy', provider: window.okxwallet?.solana || window.okxWallet?.solana });
    standardWallets().forEach(w => { if (!list.some(x => x.name === w.name)) list.push(w); });
    state.wallets = list;
    return list;
  }

  function icon(w) {
    if (w.icon) return `<img src="${w.icon}" alt="" />`;
    return w.name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  }

  function modal() {
    let o = $('#mwOverlay');
    if (o) return o;
    o = document.createElement('div');
    o.className = 'mwOverlay';
    o.id = 'mwOverlay';
    o.innerHTML = `<section class="mwBox" role="dialog" aria-modal="true"><div class="mwHead"><div><h2>Connect wallet</h2><p>Choose an installed Solana wallet for SHYPE.</p></div><button class="mwClose" type="button" aria-label="Close">×</button></div><div class="mwList"></div><div class="mwEmpty" hidden>No Solana wallet detected. Open SHYPE in Phantom, Solflare, Backpack, Glow or another Solana wallet browser.</div></section>`;
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('.mwClose')) o.classList.remove('open'); });
    document.body.appendChild(o);
    return o;
  }

  function openModal() {
    const o = modal();
    const wallets = discover();
    $('.mwList', o).innerHTML = wallets.map(w => `<button class="mwOption" type="button" data-mw="${w.name}"><span class="mwIcon">${icon(w)}</span><span><span class="mwName">${w.name}</span><span class="mwMeta">${w.type === 'standard' ? 'Wallet Standard' : 'Injected wallet'}</span></span><span class="mwPill">Connect</span></button>`).join('');
    $('.mwEmpty', o).hidden = wallets.length > 0;
    o.classList.add('open');
  }

  function updateButtons() {
    const label = state.address ? shortKey(state.address) : 'Connect';
    $$('.connectWallet, .accountSheet .primaryWide').forEach(b => {
      if (b.hasAttribute('data-view')) return;
      b.textContent = label;
      b.classList.toggle('connected', Boolean(state.address));
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = state.address ? `Connected with ${state.name}: ${state.address}` : 'No wallet connected.';
  }

  async function connect(name) {
    const w = discover().find(x => x.name === name);
    if (!w) throw new Error('Wallet not found.');
    let address = '';
    if (w.type === 'standard') {
      const result = await w.wallet.features['standard:connect'].connect({ silent: false });
      const account = result?.accounts?.[0] || w.wallet.accounts?.[0];
      address = account?.address || addr(account?.publicKey);
      state.provider = w.wallet;
    } else {
      const result = await w.provider.connect({ onlyIfTrusted: false }).catch(() => w.provider.connect());
      address = addr(result?.publicKey || w.provider.publicKey || result?.account?.publicKey);
      state.provider = w.provider;
    }
    if (!address) throw new Error(`${w.name} did not return an address.`);
    state.address = address;
    state.name = w.name;
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', w.name);
    window.SHYPE_CONNECTED_WALLET = { address, name: w.name, provider: state.provider };
    updateButtons();
    $('#mwOverlay')?.classList.remove('open');
    toast(`${w.name} connected.`);
  }

  function loadJupiter() {
    return new Promise((resolve, reject) => {
      if (window.Jupiter) return resolve();
      const s = document.createElement('script');
      s.src = 'https://terminal.jup.ag/main-v4.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function raw(amount, decimals) { return String(Math.max(0, Math.round(Number(amount || 0) * 10 ** decimals))); }

  async function openSwap() {
    if (!isSpot()) return;
    if (!state.address) { openModal(); return; }
    const [base, quote] = parts(symbol());
    const input = TOKENS[quote] || TOKENS.SOL;
    const output = TOKENS[base];
    if (!output) { toast(`No Solana mint configured for ${base} yet.`); return; }
    const amount = Number($('#tradeAmount')?.value || 1) || 1;
    await loadJupiter();
    const onSuccess = result => {
      const txid = result?.txid || result?.signature || result?.swapResult?.txid || '';
      const price = Number($('.marketNumbers strong')?.textContent?.replace(/[$€\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
      const positions = read('shypeSpotPositions', []);
      positions.unshift({ id: Date.now(), symbol: symbol(), base, quote, amount: price ? amount / price : 0, entry: price, txid, walletName: state.name, openedAt: new Date().toISOString() });
      write('shypeSpotPositions', positions);
      const history = read('shypeOrderHistory', []);
      history.unshift({ id: Date.now(), symbol: symbol(), side: 'Buy', status: 'Confirmed', txid, walletName: state.name, time: new Date().toISOString() });
      write('shypeOrderHistory', history.slice(0, 80));
      toast('Swap confirmed and tracked.');
    };
    window.Jupiter.init({
      displayMode: 'modal',
      endpoint: 'https://api.mainnet-beta.solana.com',
      strictTokenList: false,
      defaultExplorer: 'Solscan',
      formProps: { initialInputMint: input.mint, initialOutputMint: output.mint, initialAmount: raw(amount, input.decimals), swapMode: 'ExactIn' },
      onSuccess,
      onSwapError: () => toast('Swap cancelled or failed.')
    });
    if (window.Jupiter.resume) window.Jupiter.resume();
    if (window.Jupiter.show) window.Jupiter.show();
  }

  document.addEventListener('click', async e => {
    const option = e.target.closest('[data-mw]');
    if (option) { e.preventDefault(); e.stopImmediatePropagation(); try { await connect(option.dataset.mw); } catch (err) { toast(err.message || 'Wallet connection failed.'); } return; }
    const connectBtn = e.target.closest('.connectWallet, [data-wallet-connect]');
    if (connectBtn) { e.preventDefault(); e.stopImmediatePropagation(); openModal(); return; }
    const swapBtn = e.target.closest('[data-open-demo], [data-shype-open-swap]');
    if (swapBtn && isSpot()) { e.preventDefault(); e.stopImmediatePropagation(); try { await openSwap(); } catch (err) { toast(err.message || 'Swap failed.'); } }
  }, true);

  async function init() {
    discover();
    const previous = localStorage.getItem('shypeWalletName');
    if (previous && localStorage.getItem('shypeWalletConnected') === 'true') {
      const w = discover().find(x => x.name === previous);
      try {
        if (w?.type === 'legacy' && w.provider?.connect) {
          const result = await w.provider.connect({ onlyIfTrusted: true });
          state.address = addr(result?.publicKey || w.provider.publicKey);
          state.name = w.name;
          state.provider = w.provider;
        }
      } catch {}
    }
    updateButtons();
    setInterval(updateButtons, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();