(() => {
  const CHAIN = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
  const $ = (s, r = document) => r.querySelector(s);
  let client;
  let modal;

  function projectId() {
    return String(window.SHYPE_WALLETCONNECT_PROJECT_ID || document.querySelector('meta[name="walletconnect-project-id"]')?.content || '').trim();
  }

  function toast(message) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3600);
  }

  function logoMarkup() {
    const src = window.SHYPE_WC_LOGO_DATA || '';
    return src ? `<img class="scWcExact" src="${src}" alt="" />` : `<span class="scWcExactFallback"></span>`;
  }

  function patchLogo() {
    const b = $('.scAction[data-sc-wc]');
    if (b && !b.querySelector('.scWcExact')) b.innerHTML = `${logoMarkup()}<span>WalletConnect</span>`;
  }

  function timeout(p, ms, msg) {
    return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms))]);
  }

  function addressToString(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }

  function updateConnected(address, name, provider, session) {
    window.SHYPE_CONNECTED_WALLET = { address, name, provider, session };
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', name);
    document.querySelectorAll('.connectWallet,.accountSheet .primaryWide').forEach(btn => {
      if (!btn.hasAttribute('data-view')) {
        btn.textContent = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : 'Connect';
        btn.classList.toggle('connected', Boolean(address));
      }
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = address ? `Connected with ${name}: ${address}` : 'No wallet connected.';
    document.querySelector('#scOverlay')?.classList.remove('open');
    toast(`${name} connected.`);
  }

  function walletStandard() {
    const result = [];
    const add = wallet => {
      if (!wallet?.name || result.some(item => item.name === wallet.name)) return;
      if (!wallet.features?.['standard:connect']) return;
      const chains = wallet.chains || [];
      if (chains.length && !chains.some(chain => String(chain).startsWith('solana:'))) return;
      result.push({ name: wallet.name, type: 'standard', wallet, icon: wallet.icon });
    };
    try {
      const api = { register: (...wallets) => wallets.forEach(add) };
      window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }));
      window.addEventListener('wallet-standard:register-wallet', event => { try { event.detail(api); } catch {} });
    } catch {}
    return result;
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
    walletStandard().forEach(wallet => { if (!list.some(item => item.name === wallet.name)) list.push(wallet); });
    return list;
  }

  function walletIcon(wallet) {
    if (wallet.icon) return `<img src="${wallet.icon}" alt="" />`;
    return wallet.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  }

  async function connectInjected(name) {
    const wallet = installedWallets().find(item => item.name === name);
    if (!wallet) throw new Error('Wallet not found.');
    let publicKey = '';
    let provider = null;
    if (wallet.type === 'standard') {
      const response = await wallet.wallet.features['standard:connect'].connect({ silent: false });
      const account = response?.accounts?.[0] || wallet.wallet.accounts?.[0];
      publicKey = account?.address || addressToString(account?.publicKey);
      provider = wallet.wallet;
    } else {
      const response = await wallet.provider.connect({ onlyIfTrusted: false }).catch(() => wallet.provider.connect());
      publicKey = addressToString(response?.publicKey || wallet.provider.publicKey || response?.account?.publicKey);
      provider = wallet.provider;
    }
    if (!publicKey) throw new Error(`${name} did not return an address.`);
    updateConnected(publicKey, name, provider);
  }

  async function getClient() {
    if (client) return client;
    const mod = await timeout(import('https://esm.sh/@walletconnect/sign-client@2.17.4?bundle'), 14000, 'WalletConnect library did not load.');
    const SignClient = mod.default || mod.SignClient;
    client = await timeout(SignClient.init({
      projectId: projectId(),
      metadata: {
        name: 'SHYPE',
        description: 'SHYPE Solana terminal',
        url: location.origin,
        icons: [`${location.origin}/IMG_2365.png`]
      }
    }), 14000, 'WalletConnect setup timed out.');
    return client;
  }

  async function getModal() {
    if (modal) return modal;
    const mod = await timeout(import('https://esm.sh/@walletconnect/modal@2.7.0?bundle'), 14000, 'Wallet selector did not load.');
    const Modal = mod.WalletConnectModal || mod.default;
    modal = new Modal({
      projectId: projectId(),
      chains: [CHAIN],
      themeMode: 'dark',
      themeVariables: { '--wcm-z-index': '2147483900', '--wcm-accent-color': '#58caff' }
    });
    return modal;
  }

  async function createPairing() {
    const c = await getClient();
    return timeout(c.connect({
      requiredNamespaces: {
        solana: {
          chains: [CHAIN],
          methods: ['solana_signMessage', 'solana_signTransaction', 'solana_signAndSendTransaction'],
          events: ['accountsChanged', 'chainChanged']
        }
      }
    }), 14000, 'WalletConnect pairing timed out.');
  }

  async function openWalletConnect(button) {
    if (!projectId()) throw new Error('WalletConnect Project ID missing.');
    button.innerHTML = `${logoMarkup()}<span>Opening WalletConnect…</span>`;
    const modalInstance = await getModal();
    const { uri, approval } = await createPairing();
    if (!uri) throw new Error('WalletConnect URI missing.');
    document.querySelector('#scOverlay')?.classList.remove('open');
    modalInstance.openModal({ uri });
    approval().then(session => {
      modalInstance.closeModal?.();
      const account = session.namespaces?.solana?.accounts?.[0] || '';
      const address = account.split(':').pop() || '';
      updateConnected(address, 'WalletConnect', client, session);
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
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    await loadJsQr();
    return window.jsQR(data.data, data.width, data.height)?.data || '';
  }

  function showScanner() {
    const body = $('#scBody');
    if (!body) return;
    body.innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">Link Desktop Wallet</h2><p class="scSub">Scan QR from wallet app.</p><input id="scQrFile" type="file" accept="image/*" capture="environment" hidden /><button class="scScanBtn" type="button" data-sc-camera>Open camera</button><div class="scScanBox" id="scScanBox"><span class="scMuted">Point the camera at a WalletConnect QR code.</span></div><input class="scInput" id="scUriInput" placeholder="WalletConnect URI" /></div>`;
    setTimeout(() => $('#scQrFile')?.click(), 120);
  }

  function showDesktop() {
    const wallets = installedWallets();
    const body = $('#scBody');
    if (!body) return;
    if (wallets.length) {
      body.innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">Link Desktop Wallet</h2><p class="scSub">Choose installed wallet.</p><div class="scInstalled">${wallets.map(wallet => `<button class="scWallet" type="button" data-sc-fix-wallet="${wallet.name}"><span class="scIcon">${walletIcon(wallet)}</span><span>${wallet.name}</span><span class="scPill">Connect</span></button>`).join('')}</div><button class="scScanBtn" type="button" data-sc-show-scan>Scan QR instead</button></div>`;
      return;
    }
    showScanner();
  }

  async function pairScannedUri(uri) {
    if (!uri || !uri.startsWith('wc:')) throw new Error('No WalletConnect QR found.');
    const c = await getClient();
    await timeout(c.pair({ uri }), 14000, 'WalletConnect scan timed out.');
    toast('QR accepted. Continue in your wallet.');
  }

  const style = document.createElement('style');
  style.textContent = `.scWcExact{width:36px;height:36px;display:block;object-fit:contain}.scWcExactFallback{width:36px;height:36px;display:block}.scAction[data-sc-wc] .scWcIcon,.scAction[data-sc-wc] .scWcImg,.scAction[data-sc-wc] .scWcLogo{display:none!important}.scScanBox{position:relative;display:grid;place-items:center;min-height:312px;border-radius:15px;background:#02070a;margin:12px 0 8px;overflow:hidden}.scScanBtn{width:100%;min-height:54px;border-radius:14px;border:1px solid rgba(91,202,255,.35);background:rgba(91,202,255,.1);color:#78dfff;font-size:16px;margin-top:10px}.scInput{width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(145,211,239,.18);background:rgba(255,255,255,.035);color:#eef8ff;padding:0 12px;margin-top:10px}`;
  document.head.appendChild(style);

  new MutationObserver(patchLogo).observe(document.documentElement, { childList: true, subtree: true });
  patchLogo();

  document.addEventListener('click', async event => {
    const wcButton = event.target.closest?.('.scAction[data-sc-wc]');
    const desktopButton = event.target.closest?.('.scAction[data-sc-desktop]');
    const walletButton = event.target.closest?.('[data-sc-fix-wallet]');
    const cameraButton = event.target.closest?.('[data-sc-camera]');
    const scanButton = event.target.closest?.('[data-sc-show-scan]');
    if (!wcButton && !desktopButton && !walletButton && !cameraButton && !scanButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (wcButton) await openWalletConnect(wcButton);
      else if (desktopButton) showDesktop();
      else if (walletButton) await connectInjected(walletButton.dataset.scFixWallet);
      else if (cameraButton) $('#scQrFile')?.click();
      else if (scanButton) showScanner();
    } catch (error) {
      if (wcButton) wcButton.innerHTML = `${logoMarkup()}<span>WalletConnect</span>`;
      toast(error.message || 'Connection failed.');
    }
  }, true);

  document.addEventListener('change', async event => {
    if (event.target?.id === 'scQrFile') {
      const file = event.target.files?.[0];
      if (!file) return;
      const box = $('#scScanBox');
      if (box) box.innerHTML = '<span class="scMuted">Reading QR…</span>';
      try {
        const uri = await decodeQr(file);
        const input = $('#scUriInput');
        if (input) input.value = uri;
        await pairScannedUri(uri);
        if (box) box.innerHTML = '<span class="scMuted">QR accepted. Continue in your wallet.</span>';
      } catch (error) {
        if (box) box.innerHTML = `<span class="scMuted">${error.message || 'QR scan failed.'}</span>`;
        toast(error.message || 'QR scan failed.');
      }
    }
  }, true);

  document.addEventListener('change', async event => {
    if (event.target?.id === 'scUriInput' && event.target.value.trim().startsWith('wc:')) {
      try { await pairScannedUri(event.target.value.trim()); } catch (error) { toast(error.message || 'Pairing failed.'); }
    }
  }, true);
})();