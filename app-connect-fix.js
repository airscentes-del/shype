(() => {
  const CHAIN = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
  const $ = (s, r = document) => r.querySelector(s);
  const logo = () => `<svg class="scWcLogo" viewBox="0 0 1024 1024" aria-hidden="true"><path fill="#1688e9" d="M143.2 510.8 318.4 335.6c106.9-106.9 280.3-106.9 387.2 0l175.2 175.2-87.7 87.7-175.2-175.2c-58.5-58.5-153.3-58.5-211.8 0L230.9 598.5l-87.7-87.7Z"/><path fill="#1688e9" d="m67 569.5 87.7-87.7 163.7 163.7 149.8-149.8 43.8-43.8 43.8 43.8 149.8 149.8 163.7-163.7 87.7 87.7-207.6 207.6-43.8 43.8-43.8-43.8L512 627.3 362.2 777.1l-43.8 43.8-43.8-43.8L67 569.5Z"/></svg>`;
  let client;
  let modal;
  function projectId() { return String(window.SHYPE_WALLETCONNECT_PROJECT_ID || document.querySelector('meta[name="walletconnect-project-id"]')?.content || '').trim(); }
  function toast(message) { const t = $('#toast'); if (!t) return; t.textContent = message; t.classList.add('visible'); setTimeout(() => t.classList.remove('visible'), 3200); }
  function patchLogo() { const b = $('.scAction[data-sc-wc]'); if (b && !b.querySelector('.scWcLogo')) b.innerHTML = `${logo()}<span>WalletConnect</span>`; }
  function timeout(p, ms, msg) { return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms))]); }
  async function getClient() {
    if (client) return client;
    const mod = await timeout(import('https://esm.sh/@walletconnect/sign-client@2.17.4?bundle'), 12000, 'WalletConnect library did not load.');
    const SignClient = mod.default || mod.SignClient;
    client = await timeout(SignClient.init({ projectId: projectId(), metadata: { name: 'SHYPE', description: 'SHYPE Solana terminal', url: location.origin, icons: [`${location.origin}/IMG_2365.png`] } }), 12000, 'WalletConnect setup timed out.');
    return client;
  }
  async function getModal() {
    if (modal) return modal;
    const mod = await timeout(import('https://esm.sh/@walletconnect/modal@2.7.0?bundle'), 12000, 'Wallet selector did not load.');
    const Modal = mod.WalletConnectModal || mod.default;
    modal = new Modal({ projectId: projectId(), chains: [CHAIN], themeMode: 'dark', themeVariables: { '--wcm-z-index': '2147483900', '--wcm-accent-color': '#58caff' } });
    return modal;
  }
  async function openWallets(button) {
    if (!projectId()) throw new Error('WalletConnect Project ID missing.');
    button.innerHTML = `${logo()}<span>Opening WalletConnect…</span>`;
    const m = await getModal();
    const c = await getClient();
    const { uri, approval } = await timeout(c.connect({ requiredNamespaces: { solana: { chains: [CHAIN], methods: ['solana_signMessage'], events: ['accountsChanged', 'chainChanged'] } } }), 12000, 'WalletConnect pairing timed out.');
    document.querySelector('#scOverlay')?.classList.remove('open');
    m.openModal({ uri });
    approval().then(session => {
      m.closeModal?.();
      const account = session.namespaces?.solana?.accounts?.[0] || '';
      const address = account.split(':').pop() || '';
      window.SHYPE_CONNECTED_WALLET = { address, name: 'WalletConnect', provider: c, session };
      localStorage.setItem('shypeWalletConnected', 'true');
      localStorage.setItem('shypeWalletName', 'WalletConnect');
      document.querySelectorAll('.connectWallet,.accountSheet .primaryWide').forEach(btn => { if (!btn.hasAttribute('data-view')) btn.textContent = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : 'Connect'; });
      toast('Wallet connected.');
    }).catch(() => toast('Wallet connection cancelled.'));
  }
  const style = document.createElement('style');
  style.textContent = `.scWcLogo{width:36px;height:36px;display:block}.scAction[data-sc-wc] .scWcIcon{display:none!important}`;
  document.head.appendChild(style);
  new MutationObserver(patchLogo).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('.scAction[data-sc-wc]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { await openWallets(button); } catch (error) { button.innerHTML = `${logo()}<span>WalletConnect</span>`; toast(error.message || 'WalletConnect failed.'); }
  }, true);
})();