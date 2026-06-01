(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const style = document.createElement('style');
  style.textContent = `
    .ticketAction[data-open-demo],button[data-open-demo]{display:none!important;pointer-events:none!important;}
    .swOverlay{position:fixed;inset:0;z-index:2147483900;background:rgba(0,5,10,.68);backdrop-filter:blur(15px);display:none;align-items:flex-end;padding:0;}
    .swOverlay.open{display:flex;}
    .swSheet{width:100vw;max-height:88svh;overflow:auto;background:#071722;border-top:1px solid rgba(145,211,239,.22);border-radius:26px 26px 0 0;color:#eef8ff;box-shadow:0 -24px 80px rgba(0,0,0,.58);padding-bottom:env(safe-area-inset-bottom);}
    .swHead{display:flex;justify-content:space-between;gap:16px;padding:23px 23px 16px}.swHead h2{margin:0;font-size:22px;font-weight:560;letter-spacing:-.04em}.swHead p,.swNote{margin:6px 0 0;color:#9db0bb;font-size:14px;line-height:1.38}.swClose{width:40px;height:40px;border-radius:14px;border:1px solid rgba(145,211,239,.24);background:rgba(255,255,255,.035);color:#dce8ee;font-size:30px;line-height:1;display:grid;place-items:center;padding-bottom:4px}.swBody{padding:0 23px max(18px,env(safe-area-inset-bottom))}.swAction{display:grid;grid-template-columns:46px 1fr;align-items:center;gap:14px;width:100%;min-height:70px;margin:10px 0;border:1px solid rgba(145,211,239,.13);border-radius:14px;background:rgba(255,255,255,.045);color:#f0f8fb;text-align:left;padding:12px 14px;font-size:17px}.swIcon{width:34px;height:34px;display:grid;place-items:center;color:#fff}.swIcon img,.swIcon svg{width:34px;height:34px;object-fit:contain}.swDivider{display:flex;align-items:center;gap:14px;margin:20px 0 16px;color:#50606b;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.swDivider:before,.swDivider:after{content:"";height:1px;flex:1;background:rgba(145,211,239,.13)}.swBack{border:0;background:transparent;color:#75d9ff;font-size:14px;padding:2px 0 17px}.swWallet{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;width:100%;min-height:58px;border:1px solid rgba(145,211,239,.13);border-radius:13px;background:rgba(255,255,255,.03);color:#eef8ff;text-align:left;padding:9px 12px;margin-top:8px}.swWalletIcon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(91,202,255,.12);overflow:hidden}.swWalletIcon img{width:100%;height:100%;object-fit:cover}.swWallet em{font-style:normal;font-size:12px;color:#75d9ff;border:1px solid rgba(91,202,255,.3);border-radius:999px;padding:5px 9px}.swError{color:#ff819e;font-size:14px;margin-top:12px}
  `;
  document.head.appendChild(style);

  function toast(message) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 2600);
  }

  function laptopIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v8.5A2.75 2.75 0 0 1 17.25 17H6.75A2.75 2.75 0 0 1 4 14.25v-8.5Zm2.75-.25a.25.25 0 0 0-.25.25v8.5c0 .14.11.25.25.25h10.5c.14 0 .25-.11.25-.25v-8.5a.25.25 0 0 0-.25-.25H6.75ZM2.75 19.5h18.5a1.25 1.25 0 1 1 0 2.5H2.75a1.25 1.25 0 1 1 0-2.5Z" fill="currentColor"/></svg>';
  }

  function walletConnectIcon() {
    return window.SHYPE_WC_LOGO_DATA ? `<img src="${window.SHYPE_WC_LOGO_DATA}" alt="" />` : '<span style="width:34px;height:34px;border-radius:10px;background:#168ce5;display:block"></span>';
  }

  function addressText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toBase58 === 'function') return value.toBase58();
    if (typeof value.toString === 'function') return value.toString();
    return '';
  }

  function wallets() {
    const list = [];
    const add = wallet => { if (wallet?.provider && !list.some(item => item.name === wallet.name)) list.push(wallet); };
    add({ name: 'Phantom', provider: window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null) });
    add({ name: 'Solflare', provider: window.solflare || (window.solana?.isSolflare ? window.solana : null) });
    add({ name: 'Backpack', provider: window.backpack?.solana || (window.solana?.isBackpack ? window.solana : null) });
    add({ name: 'Glow', provider: window.glowSolana || (window.solana?.isGlow ? window.solana : null) });
    add({ name: 'OKX Wallet', provider: window.okxwallet?.solana || window.okxWallet?.solana });
    return list;
  }

  function overlay() {
    let node = $('#swOverlay');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'swOverlay';
    node.className = 'swOverlay';
    node.innerHTML = '<section class="swSheet"><div class="swHead"><div><h2>Connect</h2><p>Link a Solana wallet to SHYPE.</p></div><button class="swClose" type="button">×</button></div><div class="swBody" id="swBody"></div></section>';
    node.addEventListener('click', event => { if (event.target === node || event.target.closest('.swClose')) node.classList.remove('open'); });
    document.body.appendChild(node);
    return node;
  }

  function main() {
    overlay().classList.add('open');
    $('#swBody').innerHTML = `<button class="swAction" type="button" data-sw-desktop><span class="swIcon">${laptopIcon()}</span><span>Link Desktop Wallet</span></button><div class="swDivider">or</div><button class="swAction" type="button" data-sw-walletconnect><span class="swIcon">${walletConnectIcon()}</span><span>WalletConnect</span></button>`;
  }

  function desktop() {
    const found = wallets();
    if (!found.length) {
      $('#swBody').innerHTML = '<button class="swBack" type="button" data-sw-main>← Back</button><h2>Link Desktop Wallet</h2><p class="swNote">No installed Solana wallet detected in this browser. Open SHYPE inside Phantom, Solflare, Backpack, Glow or OKX, or use WalletConnect.</p>';
      return;
    }
    $('#swBody').innerHTML = `<button class="swBack" type="button" data-sw-main>← Back</button><h2>Link Desktop Wallet</h2><p class="swNote">Choose installed wallet.</p>${found.map(wallet => `<button class="swWallet" type="button" data-sw-wallet="${wallet.name}"><span class="swWalletIcon">${wallet.name.slice(0, 2)}</span><span>${wallet.name}</span><em>Connect</em></button>`).join('')}`;
  }

  function walletConnect() {
    $('#swBody').innerHTML = `<button class="swBack" type="button" data-sw-main>← Back</button><h2>WalletConnect</h2><p class="swNote">WalletConnect selector is prepared. Open SHYPE inside a Solana wallet browser for direct connection, or use Link Desktop Wallet when an installed wallet is detected.</p>`;
  }

  document.addEventListener('click', async event => {
    if (event.target.closest?.('[data-open-demo]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const topConnect = event.target.closest?.('.terminalTopbar .connectWallet');
    const action = event.target.closest?.('[data-sw-main],[data-sw-desktop],[data-sw-walletconnect],[data-sw-wallet]');
    if (!topConnect && !action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (topConnect || action?.dataset.swMain !== undefined) return main();
    if (action?.dataset.swDesktop !== undefined) return desktop();
    if (action?.dataset.swWalletconnect !== undefined) return walletConnect();
    if (action?.dataset.swWallet) {
      const wallet = wallets().find(item => item.name === action.dataset.swWallet);
      if (!wallet) return toast('Wallet not found.');
      try {
        const response = await wallet.provider.connect({ onlyIfTrusted: false }).catch(() => wallet.provider.connect());
        const address = addressText(response?.publicKey || wallet.provider.publicKey || response?.account?.publicKey);
        if (!address) throw new Error('Wallet did not return an address.');
        localStorage.setItem('shypeWalletConnected', 'true');
        localStorage.setItem('shypeWalletName', wallet.name);
        $$('.connectWallet').forEach(button => { button.textContent = `${address.slice(0, 4)}…${address.slice(-4)}`; button.classList.add('connected'); });
        $('#swOverlay')?.classList.remove('open');
        toast(`${wallet.name} connected.`);
      } catch (error) { toast(error.message || 'Connection failed.'); }
    }
  }, true);
})();