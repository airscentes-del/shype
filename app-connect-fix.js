(() => {
  const CHAIN = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
  const PROJECT_ID = () => String(window.SHYPE_WALLETCONNECT_PROJECT_ID || '').trim();
  const $ = (s, r = document) => r.querySelector(s);
  let signClient;
  let wcModal;

  function toast(message) {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('visible');
    setTimeout(() => node.classList.remove('visible'), 3200);
  }

  function timeout(promise, ms, message) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))]);
  }

  function loadLogoData() {
    if (window.SHYPE_WC_LOGO_DATA || document.querySelector('script[data-shype-wc-logo-data]')) return;
    const script = document.createElement('script');
    script.src = 'assets/walletconnect-logo-data.js?v=20260601-01';
    script.dataset.shypeWcLogoData = 'true';
    script.onload = renderMain;
    document.head.appendChild(script);
  }

  function wcIcon() {
    return window.SHYPE_WC_LOGO_DATA ? `<img class="swWcLogo" src="${window.SHYPE_WC_LOGO_DATA}" alt="" />` : '<span class="swWcLogo"></span>';
  }

  function laptopIcon() {
    return '<svg class="swLaptop" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v8.5A2.75 2.75 0 0 1 17.25 17H6.75A2.75 2.75 0 0 1 4 14.25v-8.5Zm2.75-.25a.25.25 0 0 0-.25.25v8.5c0 .14.11.25.25.25h10.5c.14 0 .25-.11.25-.25v-8.5a.25.25 0 0 0-.25-.25H6.75ZM2.75 19.5h18.5a1.25 1.25 0 1 1 0 2.5H2.75a1.25 1.25 0 1 1 0-2.5Z" fill="currentColor"/></svg>';
  }

  function ensureOverlay() {
    let overlay = $('#shypeWalletOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'shypeWalletOverlay';
    overlay.className = 'swOverlay';
    overlay.innerHTML = '<section class="swSheet"><div class="swHead"><div><h2>Connect</h2><p>Link a Solana wallet to SHYPE.</p></div><button class="swClose" type="button" aria-label="Close">×</button></div><div class="swBody" id="swBody"></div></section>';
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.swClose')) closeOverlay();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function openOverlay() {
    loadLogoData();
    const overlay = ensureOverlay();
    renderMain();
    overlay.classList.add('open');
  }

  function closeOverlay() {
    $('#shypeWalletOverlay')?.classList.remove('open');
  }

  function setBody(html) {
    const body = $('#swBody');
    if (body) body.innerHTML = html;
  }

  function renderMain() {
    if (!$('#shypeWalletOverlay.open')) return;
    setBody(`<button class="swAction" type="button" data-sw-desktop>${laptopIcon()}<span>Link Desktop Wallet</span></button><div class="swDivider">or</div><button class="swAction" type="button" data-sw-wc>${wcIcon()}<span>WalletConnect</span></button>`);
  }

  function addressText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }

  function finish(address, name, provider, session) {
    window.SHYPE_CONNECTED_WALLET = { address, name, provider, session };
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', name);
    document.querySelectorAll('.connectWallet,.accountSheet .primaryWide').forEach(button => {
      if (!button.hasAttribute('data-view')) {
        button.textContent = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : 'Connect';
        button.classList.toggle('connected', Boolean(address));
      }
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = address ? `Connected with ${name}: ${address}` : 'No wallet connected.';
    closeOverlay();
    toast(`${name} connected.`);
  }

  function standardWallets() {
    const list = [];
    const add = wallet => {
      if (!wallet?.name || list.some(item => item.name === wallet.name)) return;
      if (!wallet.features?.['standard:connect']) return;
      const chains = wallet.chains || [];
      if (chains.length && !chains.some(chain => String(chain).startsWith('solana:'))) return;
      list.push({ name: wallet.name, type: 'standard', wallet, icon: wallet.icon });
    };
    try {
      const api = { register: (...wallets) => wallets.forEach(add) };
      window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }));
      window.addEventListener('wallet-standard:register-wallet', event => { try { event.detail(api); } catch {} }, { once: true });
    } catch {}
    return list;
  }

  function installedWallets() {
    const list = [];
    const add = wallet => { if (wallet?.provider && !list.some(item => item.name === wallet.name)) list.push(wallet); };
    add({ name: 'Phantom', type: 'legacy', provider: window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null) });
    add({ name: 'Solflare', type: 'legacy', provider: window.solflare || (window.solana?.isSolflare ? window.solana : null) });
    add({ name: 'Backpack', type: 'legacy', provider: window.backpack?.solana || (window.solana?.isBackpack ? window.solana : null) });
    add({ name: 'Glow', type: 'legacy', provider: window.glowSolana || (window.solana?.isGlow ? window.solana : null) });
    add({ name: 'Exodus', type: 'legacy', provider: window.exodus?.solana });
    add({ name: 'OKX Wallet', type: 'legacy', provider: window.okxwallet?.solana || window.okxWallet?.solana });
    standardWallets().forEach(wallet => { if (!list.some(item => item.name === wallet.name)) list.push(wallet); });
    return list;
  }

  function walletIcon(wallet) {
    return wallet.icon ? `<img src="${wallet.icon}" alt="" />` : wallet.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }

  async function connectInjected(name) {
    const wallet = installedWallets().find(item => item.name === name);
    if (!wallet) throw new Error('Wallet not found.');
    if (wallet.type === 'standard') {
      const response = await wallet.wallet.features['standard:connect'].connect({ silent: false });
      const account = response?.accounts?.[0] || wallet.wallet.accounts?.[0];
      const address = account?.address || addressText(account?.publicKey);
      if (!address) throw new Error(`${name} did not return an address.`);
      finish(address, name, wallet.wallet);
      return;
    }
    const response = await wallet.provider.connect({ onlyIfTrusted: false }).catch(() => wallet.provider.connect());
    const address = addressText(response?.publicKey || wallet.provider.publicKey || response?.account?.publicKey);
    if (!address) throw new Error(`${name} did not return an address.`);
    finish(address, name, wallet.provider);
  }

  function showDesktop() {
    const wallets = installedWallets();
    if (wallets.length) {
      setBody(`<button class="swBack" type="button" data-sw-main>← Back</button><h3>Link Desktop Wallet</h3><p class="swSub">Choose installed wallet.</p><div class="swWalletList">${wallets.map(wallet => `<button class="swWallet" type="button" data-sw-wallet="${wallet.name}"><span class="swWalletIcon">${walletIcon(wallet)}</span><span>${wallet.name}</span><em>Connect</em></button>`).join('')}</div><button class="swScanBtn" type="button" data-sw-scan>Scan QR instead</button>`);
      return;
    }
    showScanner();
  }

  function showScanner() {
    setBody('<button class="swBack" type="button" data-sw-main>← Back</button><h3>Link Desktop Wallet</h3><p class="swSub">Scan QR from wallet app.</p><input id="swQrFile" type="file" accept="image/*" capture="environment" hidden /><button class="swScanBtn" type="button" data-sw-camera>Open camera</button><div class="swScanBox" id="swScanBox"><span>Point the camera at a WalletConnect QR code.</span></div><input class="swInput" id="swUriInput" placeholder="WalletConnect URI" />');
    setTimeout(() => $('#swQrFile')?.click(), 120);
  }

  async function signClientInstance() {
    if (signClient) return signClient;
    if (!PROJECT_ID()) throw new Error('WalletConnect Project ID missing.');
    const mod = await timeout(import('https://esm.sh/@walletconnect/sign-client@2.17.4?bundle'), 14000, 'WalletConnect library did not load.');
    const SignClient = mod.default || mod.SignClient;
    signClient = await timeout(SignClient.init({ projectId: PROJECT_ID(), metadata: { name: 'SHYPE', description: 'SHYPE Solana terminal', url: location.origin, icons: [`${location.origin}/IMG_2365.png`] } }), 14000, 'WalletConnect setup timed out.');
    return signClient;
  }

  async function walletConnectModal() {
    if (wcModal) return wcModal;
    const mod = await timeout(import('https://esm.sh/@walletconnect/modal@2.7.0?bundle'), 14000, 'Wallet selector did not load.');
    const Modal = mod.WalletConnectModal || mod.default;
    wcModal = new Modal({ projectId: PROJECT_ID(), chains: [CHAIN], themeMode: 'dark', themeVariables: { '--wcm-z-index': '2147483900', '--wcm-accent-color': '#58caff' } });
    return wcModal;
  }

  async function openWalletConnect(button) {
    button.innerHTML = `${wcIcon()}<span>Opening WalletConnect…</span>`;
    const modal = await walletConnectModal();
    const client = await signClientInstance();
    const { uri, approval } = await timeout(client.connect({ requiredNamespaces: { solana: { chains: [CHAIN], methods: ['solana_signMessage', 'solana_signTransaction', 'solana_signAndSendTransaction'], events: ['accountsChanged', 'chainChanged'] } } }), 14000, 'WalletConnect pairing timed out.');
    if (!uri) throw new Error('WalletConnect URI missing.');
    closeOverlay();
    modal.openModal({ uri });
    approval().then(session => {
      modal.closeModal?.();
      const account = session.namespaces?.solana?.accounts?.[0] || '';
      finish(account.split(':').pop() || '', 'WalletConnect', client, session);
    }).catch(() => toast('Wallet connection cancelled.'));
  }

  async function loadJsQr() {
    if (window.jsQR) return;
    await timeout(new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }), 10000, 'QR scanner could not load.');
  }

  async function decodeQr(file) {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    await loadJsQr();
    return window.jsQR(data.data, data.width, data.height)?.data || '';
  }

  async function pairUri(uri) {
    if (!uri || !uri.startsWith('wc:')) throw new Error('No WalletConnect QR found.');
    const client = await signClientInstance();
    await timeout(client.pair({ uri }), 14000, 'WalletConnect scan timed out.');
    toast('QR accepted. Continue in your wallet.');
  }

  const style = document.createElement('style');
  style.textContent = `
    .swOverlay{position:fixed;inset:0;z-index:2147483800;background:rgba(0,5,10,.68);backdrop-filter:blur(15px);display:none;align-items:flex-end;justify-content:stretch;padding:0;}
    .swOverlay.open{display:flex;}
    .swSheet{width:100vw;max-height:88svh;overflow:auto;background:#071722;border:1px solid rgba(145,211,239,.22);border-left:0;border-right:0;border-bottom:0;border-radius:26px 26px 0 0;color:#eef8ff;box-shadow:0 -24px 80px rgba(0,0,0,.58);padding-bottom:env(safe-area-inset-bottom);}
    .swHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:23px 23px 16px;}
    .swHead h2{margin:0;font-size:22px;font-weight:560;letter-spacing:-.04em}.swHead p,.swSub{margin:6px 0 0;color:#9db0bb;font-size:14px;line-height:1.34}.swBody{padding:0 23px max(18px,env(safe-area-inset-bottom));}.swClose{width:40px;height:40px;border-radius:14px;border:1px solid rgba(145,211,239,.24);background:rgba(255,255,255,.035);color:#dce8ee;font-size:30px;line-height:1;display:grid;place-items:center;padding-bottom:4px;}.swAction{display:grid;grid-template-columns:46px 1fr;align-items:center;gap:14px;width:100%;min-height:70px;margin:10px 0;border:1px solid rgba(145,211,239,.13);border-radius:14px;background:rgba(255,255,255,.045);color:#f0f8fb;text-align:left;padding:12px 14px;font-size:17px;}.swLaptop,.swWcLogo{width:34px;height:34px;display:block;object-fit:contain;color:#fff}.swDivider{display:flex;align-items:center;gap:14px;margin:20px 0 16px;color:#50606b;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.swDivider:before,.swDivider:after{content:"";height:1px;flex:1;background:rgba(145,211,239,.13)}.swBack{border:0;background:transparent;color:#75d9ff;font-size:14px;padding:2px 0 17px}.swBody h3{margin:0 0 6px;font-size:21px}.swWalletList{display:grid;gap:8px;margin-top:14px}.swWallet{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;width:100%;min-height:58px;border:1px solid rgba(145,211,239,.13);border-radius:13px;background:rgba(255,255,255,.03);color:#eef8ff;text-align:left;padding:9px 12px}.swWalletIcon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(115,232,255,.22),rgba(130,92,255,.16));font-weight:650;color:#8ee8ff;overflow:hidden}.swWalletIcon img{width:100%;height:100%;object-fit:cover}.swWallet em{font-style:normal;font-size:12px;color:#75d9ff;border:1px solid rgba(91,202,255,.3);border-radius:999px;padding:5px 9px}.swScanBtn{width:100%;min-height:54px;border-radius:14px;border:1px solid rgba(91,202,255,.35);background:rgba(91,202,255,.1);color:#78dfff;font-size:16px;margin-top:10px}.swScanBox{display:grid;place-items:center;min-height:312px;border-radius:15px;background:#02070a;margin:12px 0 8px;color:#9db0bb;text-align:center;padding:18px}.swInput{width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(145,211,239,.18);background:rgba(255,255,255,.035);color:#eef8ff;padding:0 12px;margin-top:10px}wcm-modal{z-index:2147483900!important;}
  `;
  document.head.appendChild(style);
  loadLogoData();

  window.addEventListener('click', async event => {
    const connectButton = event.target.closest?.('.connectWallet,.accountSheet .primaryWide');
    const action = event.target.closest?.('[data-sw-main],[data-sw-desktop],[data-sw-wc],[data-sw-wallet],[data-sw-camera],[data-sw-scan]');
    if (!connectButton && !action) return;
    if (connectButton?.hasAttribute('data-view')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (connectButton && !action) openOverlay();
      else if (action?.dataset.swMain !== undefined) renderMain();
      else if (action?.dataset.swDesktop !== undefined) showDesktop();
      else if (action?.dataset.swWc !== undefined) await openWalletConnect(action);
      else if (action?.dataset.swWallet) await connectInjected(action.dataset.swWallet);
      else if (action?.dataset.swCamera !== undefined) $('#swQrFile')?.click();
      else if (action?.dataset.swScan !== undefined) showScanner();
    } catch (error) {
      toast(error.message || 'Connection failed.');
      renderMain();
    }
  }, true);

  window.addEventListener('change', async event => {
    if (event.target?.id === 'swQrFile') {
      const file = event.target.files?.[0];
      if (!file) return;
      const box = $('#swScanBox');
      if (box) box.textContent = 'Reading QR…';
      try {
        const uri = await decodeQr(file);
        const input = $('#swUriInput');
        if (input) input.value = uri;
        await pairUri(uri);
        if (box) box.textContent = 'QR accepted. Continue in your wallet.';
      } catch (error) {
        if (box) box.textContent = error.message || 'QR scan failed.';
        toast(error.message || 'QR scan failed.');
      }
    }
  }, true);
})();