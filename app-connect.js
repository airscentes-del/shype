(() => {
  const TOKENS = {
    SOL: ['So11111111111111111111111111111111111111112', 9],
    USDC: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 6],
    USDT: ['Es9vMFrzaCERmJfrF4H2FYD4KiLv4nccBRBn24Ttr4evXF', 6],
    JUP: ['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', 6],
    WIF: ['EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzL4QM92QJN', 6]
  };

  const SOLANA_MAINNET = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
  const LAPTOP_ICON = 'https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons/outline/device-laptop.svg';
  const WALLETCONNECT_ICON = 'https://registry.walletconnect.org/logo/md/walletconnect-logo.svg';

  const state = {
    address: '',
    name: '',
    provider: null,
    signClient: null,
    wcModal: null,
    wcSession: null,
    desktopApproval: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function wcProjectId() {
    const meta = document.querySelector('meta[name="walletconnect-project-id"]')?.content || '';
    const globalId = window.SHYPE_WALLETCONNECT_PROJECT_ID || window.SHYPE_WC_PROJECT_ID || '';
    return String(globalId || meta).trim();
  }

  function toast(message) {
    const toastNode = $('#toast');
    if (!toastNode) return;
    toastNode.textContent = message;
    toastNode.classList.add('visible');
    setTimeout(() => toastNode.classList.remove('visible'), 2800);
  }

  function addressToString(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }

  function shortAddress(value) {
    return value ? `${value.slice(0, 4)}…${value.slice(-4)}` : 'Connect';
  }

  function pairSymbol() {
    return $('.marketIdentity strong')?.textContent?.trim() || 'SOL/USDC';
  }

  function pairParts() {
    return pairSymbol().split(/[/-]/);
  }

  function isSpot() {
    return pairSymbol().includes('/');
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function injectStyles() {
    if ($('#shypeConnectStyle')) return;
    const style = document.createElement('style');
    style.id = 'shypeConnectStyle';
    style.textContent = `
      .scOverlay{position:fixed;inset:0;z-index:2147483600;background:rgba(0,5,10,.68);backdrop-filter:blur(15px);display:none;align-items:flex-end;justify-content:stretch;padding:0;}
      .scOverlay.open{display:flex;}
      .scSheet{width:100vw;max-width:none;max-height:88svh;overflow:auto;background:#071722;border:1px solid rgba(145,211,239,.22);border-left:0;border-right:0;border-bottom:0;border-radius:26px 26px 0 0;color:#eef8ff;box-shadow:0 -24px 80px rgba(0,0,0,.58);margin:0;padding-bottom:env(safe-area-inset-bottom);}
      .scHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:23px 23px 16px;}
      .scTitle{margin:0;font-size:22px;font-weight:520;letter-spacing:-.04em;line-height:1.05;}
      .scSub{margin:6px 0 0;color:#9db0bb;font-size:14px;line-height:1.34;}
      .scClose{width:40px;height:40px;border-radius:14px;border:1px solid rgba(145,211,239,.24);background:rgba(255,255,255,.035);color:#dce8ee;font-size:30px;line-height:1;display:grid;place-items:center;padding-bottom:4px;}
      .scBody{padding:0 23px max(18px, env(safe-area-inset-bottom));}
      .scAction{display:grid;grid-template-columns:46px 1fr;align-items:center;gap:14px;width:100%;min-height:70px;margin:10px 0;border:1px solid rgba(145,211,239,.13);border-radius:14px;background:rgba(255,255,255,.045);color:#f0f8fb;text-align:left;padding:12px 14px;font-size:17px;}
      .scActionIcon{width:29px;height:29px;display:block;object-fit:contain;}
      .scLaptopIcon{filter:brightness(0) invert(1);opacity:.9;}
      .scWcIcon{width:32px;height:32px;}
      .scDivider{display:flex;align-items:center;gap:14px;margin:20px 0 16px;color:#50606b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;}
      .scDivider:before,.scDivider:after{content:"";height:1px;flex:1;background:rgba(145,211,239,.13);}
      .scPanel{padding:3px 0 8px;}
      .scBack{border:0;background:transparent;color:#75d9ff;font-size:14px;padding:2px 0 17px;}
      .scMuted{color:#9db0bb;}
      .scInstalled{display:grid;gap:8px;margin-top:14px;}
      .scWallet{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;width:100%;min-height:58px;border:1px solid rgba(145,211,239,.13);border-radius:13px;background:rgba(255,255,255,.03);color:#eef8ff;text-align:left;padding:9px 12px;}
      .scIcon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(115,232,255,.22),rgba(130,92,255,.16));font-weight:650;color:#8ee8ff;overflow:hidden;}
      .scIcon img{width:100%;height:100%;object-fit:cover;}
      .scPill{font-size:12px;color:#75d9ff;border:1px solid rgba(91,202,255,.3);border-radius:999px;padding:5px 9px;}
      .scQrBox{position:relative;display:grid;place-items:center;min-height:312px;border-radius:15px;background:#02070a;margin:12px 0 8px;overflow:hidden;}
      .scQrBox canvas{width:242px!important;height:242px!important;border-radius:12px;background:#fff;padding:10px;}
      .scInput{width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(145,211,239,.18);background:rgba(255,255,255,.035);color:#eef8ff;padding:0 12px;margin-top:10px;}
      .connectWallet.connected{font-size:16px;letter-spacing:-.02em;}
      wcm-modal{z-index:2147483900!important;}
      @media(min-width:720px){.scSheet{width:100vw;}}
    `;
    document.head.appendChild(style);
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

  function sheet() {
    injectStyles();
    let overlay = $('#scOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'scOverlay';
    overlay.id = 'scOverlay';
    overlay.innerHTML = `<section class="scSheet"><div class="scHead"><div><h2 class="scTitle">Connect</h2><p class="scSub">Link a Solana wallet to SHYPE.</p></div><button class="scClose" type="button" aria-label="Close">×</button></div><div class="scBody" id="scBody"></div></section>`;
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('.scClose')) closeSheet(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeSheet() {
    $('#scOverlay')?.classList.remove('open');
  }

  function showMain() {
    const overlay = sheet();
    $('#scBody', overlay).innerHTML = `
      <button class="scAction" type="button" data-sc-desktop><img class="scActionIcon scLaptopIcon" src="${LAPTOP_ICON}" alt="" /><span>Link Desktop Wallet</span></button>
      <div class="scDivider">or</div>
      <button class="scAction" type="button" data-sc-wc><img class="scActionIcon scWcIcon" src="${WALLETCONNECT_ICON}" alt="" /><span>WalletConnect</span></button>
    `;
    overlay.classList.add('open');
  }

  async function connectInjected(name) {
    const wallet = installedWallets().find(item => item.name === name);
    if (!wallet) throw new Error('Wallet not found.');
    let publicKey = '';
    if (wallet.type === 'standard') {
      const response = await wallet.wallet.features['standard:connect'].connect({ silent: false });
      const account = response?.accounts?.[0] || wallet.wallet.accounts?.[0];
      publicKey = account?.address || addressToString(account?.publicKey);
      state.provider = wallet.wallet;
    } else {
      const response = await wallet.provider.connect({ onlyIfTrusted: false }).catch(() => wallet.provider.connect());
      publicKey = addressToString(response?.publicKey || wallet.provider.publicKey || response?.account?.publicKey);
      state.provider = wallet.provider;
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

  async function showDesktopWallet() {
    const wallets = installedWallets();
    if (wallets.length) {
      $('#scBody').innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">Link Desktop Wallet</h2><p class="scSub">Choose installed wallet.</p><div class="scInstalled">${wallets.map(wallet => `<button class="scWallet" type="button" data-sc-wallet="${wallet.name}"><span class="scIcon">${walletIcon(wallet)}</span><span>${wallet.name}</span><span class="scPill">Connect</span></button>`).join('')}</div></div>`;
      return;
    }
    await showDesktopQr();
  }

  async function signClient() {
    if (state.signClient) return state.signClient;
    const projectId = wcProjectId();
    if (!projectId) throw new Error('WalletConnect Project ID missing.');
    const mod = await import('https://esm.sh/@walletconnect/sign-client@2.17.4?bundle');
    const SignClient = mod.default || mod.SignClient;
    state.signClient = await SignClient.init({
      projectId,
      metadata: {
        name: 'SHYPE',
        description: 'SHYPE Solana trading terminal',
        url: location.origin,
        icons: [`${location.origin}/IMG_2365.png`]
      }
    });
    return state.signClient;
  }

  async function walletConnectModal(projectId) {
    if (state.wcModal) return state.wcModal;
    const mod = await import('https://esm.sh/@walletconnect/modal@2.7.0?bundle');
    const WalletConnectModal = mod.WalletConnectModal || mod.default;
    state.wcModal = new WalletConnectModal({
      projectId,
      themeMode: 'dark',
      themeVariables: {
        '--wcm-z-index': '2147483900',
        '--wcm-accent-color': '#58caff'
      }
    });
    return state.wcModal;
  }

  async function createWalletConnectPairing() {
    const client = await signClient();
    return client.connect({
      requiredNamespaces: {
        solana: {
          chains: [SOLANA_MAINNET],
          methods: ['solana_signMessage', 'solana_signTransaction', 'solana_signAndSendTransaction', 'solana_signAllTransactions'],
          events: ['accountsChanged', 'chainChanged']
        }
      }
    });
  }

  async function finishWalletConnect(approval) {
    const session = await approval();
    try { state.wcModal?.closeModal?.(); } catch {}
    state.wcSession = session;
    const account = session.namespaces?.solana?.accounts?.[0] || '';
    state.address = account.split(':').pop() || '';
    state.name = 'WalletConnect';
    state.provider = state.signClient;
    window.SHYPE_CONNECTED_WALLET = { address: state.address, name: state.name, provider: state.provider, session };
    localStorage.setItem('shypeWalletConnected', 'true');
    localStorage.setItem('shypeWalletName', 'WalletConnect');
    updateUi();
    closeSheet();
    toast('Wallet connected.');
  }

  async function loadQrLib() {
    if (window.QRCode?.toCanvas) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function showDesktopQr() {
    $('#scBody').innerHTML = `<div class="scPanel"><button class="scBack" type="button" data-sc-main>← Back</button><h2 class="scTitle">Link Desktop Wallet</h2><p class="scSub">Scan QR from wallet app.</p><div class="scQrBox" id="desktopQr"><span class="scMuted">Creating QR…</span></div><input class="scInput" id="desktopUri" readonly placeholder="WalletConnect URI" /></div>`;
    const { uri, approval } = await createWalletConnectPairing();
    if (!uri) throw new Error('WalletConnect URI missing.');
    await loadQrLib();
    $('#desktopQr').innerHTML = '<canvas id="desktopQrCanvas"></canvas>';
    window.QRCode.toCanvas($('#desktopQrCanvas'), uri, { margin: 1, width: 242 });
    $('#desktopUri').value = uri;
    state.desktopApproval = approval;
    finishWalletConnect(approval).catch(() => toast('Wallet connection cancelled.'));
  }

  async function openWalletConnectSelector() {
    const projectId = wcProjectId();
    if (!projectId) throw new Error('WalletConnect Project ID missing.');
    const { uri, approval } = await createWalletConnectPairing();
    if (!uri) throw new Error('WalletConnect URI missing.');
    closeSheet();
    const modal = await walletConnectModal(projectId);
    modal.openModal({ uri });
    finishWalletConnect(approval).catch(() => toast('Wallet connection cancelled.'));
  }

  function updateUi() {
    const label = state.address ? shortAddress(state.address) : 'Connect';
    $$('.connectWallet, .accountSheet .primaryWide').forEach(button => {
      if (button.hasAttribute('data-view')) return;
      button.textContent = label;
      button.classList.toggle('connected', Boolean(state.address));
    });
    const status = $('.walletStatusText');
    if (status) status.textContent = state.address ? `Connected with ${state.name}: ${state.address}` : 'No wallet connected.';
  }

  function raw(amount, decimals) {
    return String(Math.max(0, Math.round(Number(amount || 0) * 10 ** decimals)));
  }

  async function loadJupiter() {
    if (window.Jupiter) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://terminal.jup.ag/main-v4.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
    window.Jupiter.init({
      displayMode: 'modal',
      endpoint: 'https://api.mainnet-beta.solana.com',
      strictTokenList: false,
      defaultExplorer: 'Solscan',
      formProps: {
        initialInputMint: input[0],
        initialOutputMint: output[0],
        initialAmount: raw(amount, input[1]),
        swapMode: 'ExactIn'
      },
      onSuccess: result => {
        const txid = result?.txid || result?.signature || result?.swapResult?.txid || '';
        const positions = readJson('shypeSpotPositions', []);
        positions.unshift({ id: Date.now(), symbol: pairSymbol(), base, quote, amount, entry: 0, txid, walletName: state.name, openedAt: new Date().toISOString() });
        writeJson('shypeSpotPositions', positions);
        toast('Swap confirmed and tracked.');
      },
      onSwapError: () => toast('Swap cancelled or failed.')
    });
    window.Jupiter.show?.();
  }

  document.addEventListener('click', async event => {
    const walletButton = event.target.closest('.connectWallet, [data-wallet-connect]');
    if (walletButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMain();
      return;
    }

    const action = event.target.closest('[data-sc-main],[data-sc-desktop],[data-sc-wc],[data-sc-wallet]');
    if (action) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        if (action.dataset.scMain !== undefined) showMain();
        else if (action.dataset.scDesktop !== undefined) await showDesktopWallet();
        else if (action.dataset.scWc !== undefined) await openWalletConnectSelector();
        else if (action.dataset.scWallet) await connectInjected(action.dataset.scWallet);
      } catch (error) {
        toast(error.message || 'Connection failed.');
      }
      return;
    }

    const swap = event.target.closest('[data-open-demo], [data-shype-open-swap]');
    if (swap && isSpot()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await openSwap();
    }
  }, true);

  async function init() {
    injectStyles();
    const previous = localStorage.getItem('shypeWalletName');
    if (previous && previous !== 'WalletConnect') {
      const wallet = installedWallets().find(item => item.name === previous);
      try {
        if (wallet?.provider?.connect) {
          const response = await wallet.provider.connect({ onlyIfTrusted: true });
          state.address = addressToString(response?.publicKey || wallet.provider.publicKey);
          state.name = wallet.name;
          state.provider = wallet.provider;
        }
      } catch {}
    }
    updateUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();