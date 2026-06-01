(() => {
  const TOKENS = {
    SOL: ['So11111111111111111111111111111111111111112', 9],
    USDC: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6],
    USDT: ['Es9vMFrzaCERmJfrF4H2FYD4KiLv4nccBRBn24Ttr4evXF', 6],
    JUP: ['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', 6],
    WIF: ['EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL4QM92QJN', 6]
  };
  const SOLANA_MAINNET = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
  const state = { address: '', name: '', provider: null, signClient: null, wcSession: null };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function wcProjectId() {
    const meta = document.querySelector('meta[name="walletconnect-project-id"]')?.content || '';
    const globalId = window.SHYPE_WALLETCONNECT_PROJECT_ID || window.SHYPE_WC_PROJECT_ID || '';
    return String(globalId || meta).trim();
  }
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2800);
  }
  function addr(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v.toBase58 === 'function') return v.toBase58();
    if (typeof v.toString === 'function') return v.toString();
    return '';
  }
  function shortKey(v) { return v ? `${v.slice(0, 4)}…${v.slice(-4)}` : 'Connect'; }
  function pairParts() { return String($('.marketIdentity strong')?.textContent?.trim() || 'SOL/USDC').split(/[/-]/); }
  function pairSymbol() { return $('.marketIdentity strong')?.textContent?.trim() || 'SOL/USDC'; }
  function isSpot() { return pairSymbol().includes('/'); }
  function read(k, f) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(f)); } catch { return f; } }
  function write(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  function injectStyles() {
    if ($('#shypeConnectStyle')) return;
    const st = document.createElement('style');
    st.id = 'shypeConnectStyle';
    st.textContent = `
      .scOverlay{position:fixed;inset:0;z-index:2147483600;background:rgba(0,5,10,.66);backdrop-filter:blur(14px);display:none;align-items:flex-end;justify-content:center;padding:18px}.scOverlay.open{display:flex}.scSheet{width:min(100%,430px);max-height:82vh;overflow:auto;background:#071722;border:1px solid rgba(145,211,239,.23);border-radius:22px;color:#eef8ff;box-shadow:0 24px 80px rgba(0,0,0,.55)}.scHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 22px 16px}.scTitle{margin:0;font-size:22px;font-weight:520;letter-spacing:-.04em}.scSub{margin:6px 0 0;color:#9db0bb;font-size:14px;line-height:1.35}.scClose{width:38px;height:38px;border-radius:13px;border:1px solid rgba(145,211,239,.24);background:rgba(255,255,255,.03);color:#dce8ee;font-size:28px;line-height:1}.scBody{padding:0 14px 16px}.scAction{display:grid;grid-template-columns:46px 1fr;align-items:center;gap:14px;width:100%;min-height:70px;margin:10px 0;border:1px solid rgba(145,211,239,.13);border-radius:14px;background:rgba(255,255,255,.035);color:#f0f8fb;text-align:left;padding:12px 14px;font-size:17px}.scAction svg{width:30px;height:30px;color:#d6e2e8}.scDivider{display:flex;align-items:center;gap:14px;margin:20px 0 16px;color:#4f606a;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.scDivider:before,.scDivider:after{content:"";height:1px;flex:1;background:rgba(145,211,239,.13)}.scMuted{color:#9db0bb}.scPanel{padding:4px 10px 14px}.scBack{border:0;background:transparent;color:#75d9ff;font-size:14px;padding:4px 0 16px}.scQrBox{display:grid;place-items:center;min-height:292px;border-radius:16px;border:1px dashed rgba(145,211,239,.23);background:#02070a;margin:8px 0 14px;overflow:hidden}.scQrBox canvas{width:240px!important;height:240px!important;border-radius:12px;background:#fff;padding:10px}.scVideo{width:100%;min-height:300px;object-fit:cover;background:#000}.scInstalled{display:grid;gap:8px}.scWallet{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;width:100%;min-height:58px;border:1px solid rgba(145,211,239,.13);border-radius:13px;background:rgba(255,255,255,.025);color:#eef8ff;text-align:left;padding:9px 12px}.scIcon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(115,232,255,.22),rgba(130,92,255,.16));font-weight:650;color:#8ee8ff;overflow:hidden}.scIcon img{width:100%;height:100%;object-fit:cover}.scPill{font-size:12px;color:#75d9ff;border:1px solid rgba(91,202,255,.3);border-radius:999px;padding:5px 9px}.scInput{width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(145,211,239,.18);background:rgba(255,255,255,.035);color:#eef8ff;padding:0 12px;margin-top:10px}.connectWallet.connected{font-size:16px;letter-spacing:-.02em}@media(min-width:720px){.scOverlay{align-items:center}.scSheet{border-radius:22px}}
    `;
    document.head.appendChild(st);
  }

  function walletStandard() {
    const res = [];
    const add = w => {
      if (!w?.name || res.some(x => x.name === w.name)) return;
      if (!w.features?.['standard:connect']) return;
      const chains = w.chains || [];
      if (chains.length && !chains.some(c => String(c).startsWith('solana:'))) return;
      res.push({ name: w.name, type: 'standard', wallet: w, icon: w.icon });
    };
    try {
      const api = { register: (...ws) => ws.forEach(add) };
      window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }));
      window.addEventListener('wallet-standard:register-wallet', e => { try { e.detail(api); } catch {} });
    } catch {}
    return res;
  }
  function installedWallets() {
    const list = [];
    const add = w => { if (w?.provider && !list.some(x => x.name === w.name)) list.push(w); };
    add({ name: 'Phantom', type: 'legacy', provider: window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null) });
    add({ name: 'Solflare', type: 'legacy', provider: window.solflare || (window.solana?.isSolflare ? window.solana : null) });
    add({ name: 'Backpack', type: 'legacy', provider: window.backpack?.solana || (window.solana?.isBackpack ? window.solana : null) });
    add({ name: 'Glow', type: 'legacy', provider: window.glowSolana || (window.solana?.isGlow ? window.solana : null) });
    add({ name: 'Exodus', type: 'legacy', provider: window.exodus?.solana });
    add({ name: 'OKX Wallet', type: 'legacy', provider: window.okxwallet?.solana || window.okxWallet?.solana });
    walletStandard().forEach(w => { if (!list.some(x => x.name === w.name)) list.push(w); });
    return list;
  }
  function walletIcon(w) {
    if (w.icon) return `<img src="${w.icon}" alt="" />`;
    return w.name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  }

  function sheet() {
    injectStyles();
    let o = $('#scOverlay');
    if (o) return o;
    o = document.createElement('div');
    o.className = 'scOverlay';
    o.id = 'scOverlay';
    o.innerHTML = `<section class="scSheet"><div class="scHead"><div><h2 class="scTitle">Connect</h2><p class="scSub">Link a Solana wallet to SHYPE.</p></div><button class="scClose" type="button">×</button></div><div class="scBody" id="scBody"></div></section>`;
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('.scClose')) closeSheet(); });
    document.body.appendChild(o);
    return o;
  }
  function closeSheet() {
    $('#scOverlay')?.classList.remove('open');
    stopScan();
  }
  function showMain() {
    const o = sheet();
    $('#scBody', o).innerHTML = `
      <button class="scAction" type="button" data-sc-link><svg viewBox="0 0 24 24" fill="none"><path d="M6 5h12v10H6V5Zm-2 14h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Link Wallet</span></button>
      <div class="scDivider">or</div>
      <button class="scAction" type="button" data-sc-wc><svg viewBox="0 0 24 24" fill="none"><path d="M7.6 9.5a6.3 6.3 0 0 1 8.8 0l.3.3m-11.3 2a9.5 9.5 0 0 1 13.2 0m-8.8 2.3a3.2 3.2 0 0 1 4.4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>WalletConnect</span></button>
    `;
    o.classList.add('open');
  }

  async function connectInjected(name) {
    const w = installedWallets().find(x => x.name === name);
    if (!w) throw new Error('Wallet not found.');
    let publicKey = '';
    if (w.type === 'standard') {
      const r = await w.wallet.features['standard:connect'].connect({ silent: false });
      const a = r?.accounts?.[0] || w.wallet.accounts?.[0];
      publicKey = a?.address || addr(a?.publicKey);
      state.provider = w.wallet;
    } else {
      const r = await w.provider.connect({ onlyIfTrusted: false }).catch(() => w.provider.connect());
      publicKey = addr(r?.publicKey || w.provider.publicKey || r?.account?.publicKey);
      state.provider = w.provider;
    }
    if (!publicKey) throw new Error(`${name} did not return an address.`);
    state.address = publicKey;
    state.name = name;
    window.SHYPE_CONNECTED_WALLET = { address: state.address, name: state.name, provider: state.provider };
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', name);
    updateUi();
    closeSheet();
    toast(`${name} connected.`);
  }

  function showLinkWallet() {
    const ws = installedWallets();
    const installed = ws.length ? `<div class="scInstalled">${ws.map(w => `<button class="scWallet" type="button" data-sc-wallet="${w.name}"><span class="scIcon">${walletIcon(w)}</span><span>${w.name}</span><span class="scPill">Connect</span></button>`).join('')}</div>` : `<p class="scMuted">No installed wallet was detected in this browser. You can still use WalletConnect QR from desktop, or open SHYPE inside a wallet browser.</p>`;
    $('#scBody').innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">Link Wallet</h2><p class="scSub">Use an installed Solana wallet, or scan a WalletConnect QR code.</p>${installed}<button class="scAction" type="button" data-sc-scan><svg viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m8 0h3a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 12h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Scan QR Code</span></button></div>`;
  }

  let scanStream = null;
  function stopScan() {
    scanStream?.getTracks?.().forEach(t => t.stop());
    scanStream = null;
  }
  async function showScanner() {
    $('#scBody').innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-link>← Back</button><h2 class="scTitle">Scan QR Code</h2><p class="scSub">Scan a WalletConnect QR code to link this session.</p><div class="scQrBox"><video class="scVideo" playsinline muted></video></div><p class="scMuted" id="scanHint">Waiting for camera permission…</p></div>`;
    try {
      const video = $('.scVideo');
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = scanStream;
      await video.play();
      $('#scanHint').textContent = 'Point the camera at a WalletConnect QR code.';
      scanLoop(video);
    } catch {
      $('#scanHint').textContent = 'Camera permission was blocked. Use WalletConnect to display a QR code instead.';
    }
  }
  async function scanLoop(video) {
    if (!scanStream || !video.isConnected) return;
    try {
      if ('BarcodeDetector' in window) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(video);
        const raw = codes?.[0]?.rawValue || '';
        if (raw.startsWith('wc:')) { stopScan(); await connectWalletConnectUri(raw); return; }
      }
    } catch {}
    requestAnimationFrame(() => scanLoop(video));
  }

  async function signClient() {
    if (state.signClient) return state.signClient;
    const projectId = wcProjectId();
    if (!projectId) throw new Error('WalletConnect Project ID missing.');
    const mod = await import('https://esm.sh/@walletconnect/sign-client@2.17.4?bundle');
    const SignClient = mod.default || mod.SignClient;
    state.signClient = await SignClient.init({
      projectId,
      metadata: { name: 'SHYPE', description: 'SHYPE Solana trading terminal', url: location.origin, icons: [`${location.origin}/IMG_2365.png`] }
    });
    return state.signClient;
  }
  async function loadQrLib() {
    if (window.QRCode?.toCanvas) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  async function connectWalletConnectUri(uri) {
    const client = await signClient();
    if (uri) await client.pair({ uri });
    toast('WalletConnect session request sent.');
  }
  async function showWalletConnect() {
    $('#scBody').innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">WalletConnect</h2><p class="scSub">Scan this QR code with a WalletConnect-compatible Solana wallet.</p><div class="scQrBox" id="wcQrBox"><span class="scMuted">Creating QR…</span></div><input class="scInput" id="wcUriInput" readonly placeholder="WalletConnect URI" /></div>`;
    const projectId = wcProjectId();
    if (!projectId) {
      $('#wcQrBox').innerHTML = '<p class="scMuted" style="padding:20px;text-align:center">WalletConnect needs a Reown / WalletConnect Project ID. Add it as SHYPE_WALLETCONNECT_PROJECT_ID or a walletconnect-project-id meta tag.</p>';
      return;
    }
    const client = await signClient();
    const { uri, approval } = await client.connect({ requiredNamespaces: { solana: { chains: [SOLANA_MAINNET], methods: ['solana_signMessage','solana_signTransaction','solana_signAndSendTransaction','solana_signAllTransactions'], events: ['accountsChanged','chainChanged'] } } });
    if (uri) {
      await loadQrLib();
      $('#wcQrBox').innerHTML = '<canvas id="wcCanvas"></canvas>';
      window.QRCode.toCanvas($('#wcCanvas'), uri, { margin: 1, width: 240 });
      $('#wcUriInput').value = uri;
    }
    const session = await approval();
    state.wcSession = session;
    const account = session.namespaces?.solana?.accounts?.[0] || '';
    state.address = account.split(':').pop() || '';
    state.name = 'WalletConnect';
    state.provider = client;
    window.SHYPE_CONNECTED_WALLET = { address: state.address, name: state.name, provider: client, session };
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', 'WalletConnect');
    updateUi();
    closeSheet();
    toast('Wallet connected.');
  }

  function updateUi() {
    const label = state.address ? shortKey(state.address) : 'Connect';
    $$('.connectWallet, .accountSheet .primaryWide').forEach(b => {
      if (b.hasAttribute('data-view')) return;
      b.textContent = label;
      b.classList.toggle('connected', Boolean(state.address));
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = state.address ? `Connected with ${state.name}: ${state.address}` : 'No wallet connected.';
  }
  function raw(amount, decimals) { return String(Math.max(0, Math.round(Number(amount || 0) * 10 ** decimals))); }
  async function loadJupiter() {
    if (window.Jupiter) return;
    await new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://terminal.jup.ag/main-v4.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); });
  }
  async function openSwap() {
    if (!isSpot()) return;
    if (!state.address) { showMain(); return; }
    const [base, quote] = pairParts();
    const input = TOKENS[quote] || TOKENS.SOL;
    const output = TOKENS[base];
    if (!output) { toast(`No Solana mint configured for ${base} yet.`); return; }
    const amount = Number($('#tradeAmount')?.value || 1) || 1;
    await loadJupiter();
    window.Jupiter.init({ displayMode: 'modal', endpoint: 'https://api.mainnet-beta.solana.com', strictTokenList: false, defaultExplorer: 'Solscan', formProps: { initialInputMint: input[0], initialOutputMint: output[0], initialAmount: raw(amount, input[1]), swapMode: 'ExactIn' }, onSuccess: r => {
      const txid = r?.txid || r?.signature || r?.swapResult?.txid || '';
      const pos = read('shypeSpotPositions', []);
      pos.unshift({ id: Date.now(), symbol: pairSymbol(), base, quote, amount, entry: 0, txid, walletName: state.name, openedAt: new Date().toISOString() });
      write('shypeSpotPositions', pos);
      toast('Swap confirmed and tracked.');
    }, onSwapError: () => toast('Swap cancelled or failed.') });
    window.Jupiter.show?.();
  }

  document.addEventListener('click', async e => {
    const walletBtn = e.target.closest('.connectWallet, [data-wallet-connect]');
    if (walletBtn) { e.preventDefault(); e.stopImmediatePropagation(); showMain(); return; }
    const action = e.target.closest('[data-sc-main],[data-sc-link],[data-sc-wc],[data-sc-scan],[data-sc-wallet]');
    if (action) {
      e.preventDefault(); e.stopImmediatePropagation();
      try {
        if (action.dataset.scMain !== undefined) showMain();
        else if (action.dataset.scLink !== undefined) showLinkWallet();
        else if (action.dataset.scWc !== undefined) await showWalletConnect();
        else if (action.dataset.scScan !== undefined) await showScanner();
        else if (action.dataset.scWallet) await connectInjected(action.dataset.scWallet);
      } catch (err) { toast(err.message || 'Connection failed.'); }
      return;
    }
    const swap = e.target.closest('[data-open-demo], [data-shype-open-swap]');
    if (swap && isSpot()) { e.preventDefault(); e.stopImmediatePropagation(); await openSwap(); }
  }, true);

  async function init() {
    injectStyles();
    const prev = localStorage.getItem('shypeWalletName');
    if (prev && prev !== 'WalletConnect') {
      const w = installedWallets().find(x => x.name === prev);
      try {
        if (w?.provider?.connect) {
          const r = await w.provider.connect({ onlyIfTrusted: true });
          state.address = addr(r?.publicKey || w.provider.publicKey);
          state.name = w.name;
          state.provider = w.provider;
        }
      } catch {}
    }
    updateUi();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();