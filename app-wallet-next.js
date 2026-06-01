(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const style = document.createElement('style');
  style.textContent = '.walletBox{padding:16px}.walletRow{display:flex;justify-content:space-between;border-bottom:1px solid rgba(145,211,239,.14);padding:12px 0}.walletRow p{margin:4px 0 0;color:#9db0bb;font-size:13px}.walletRow h3{margin:0;font-size:18px}.walletSlider{display:flex;gap:12px;align-items:center;margin:12px 0}.walletSlider input{flex:1;accent-color:#58caff}.accountSheet.compact .primaryWide{display:none!important}.emptyState button[data-view="markets"]{display:none!important}';
  document.head.appendChild(style);
  function connected(){ return localStorage.getItem('shypeWalletConnected') === 'true'; }
  function fmt(n){ return Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: 6 }); }
  function usd(n){ return '$' + Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function render(){
    const list = $('#positionsList');
    if(!list) return;
    const active = $('.accountTabs button.active')?.textContent?.trim().toLowerCase() || 'positions';
    if(active.includes('balance')) list.innerHTML = '<div class="walletBox"><article class="walletRow"><div><h3>SOL</h3><p>Connect wallet to load live balance</p></div><strong>--</strong></article><article class="walletRow"><div><h3>USDC</h3><p>Connect wallet to load live balance</p></div><strong>--</strong></article><article class="walletRow"><div><h3>USDT</h3><p>Connect wallet to load live balance</p></div><strong>--</strong></article></div>';
    if(active.includes('open')) list.innerHTML = '<div class="walletBox"><p>No open orders yet.</p></div>';
    if(active.includes('history')) list.innerHTML = '<div class="walletBox"><p>No SHYPE trades yet.</p></div>';
    $$('.emptyState').forEach(e => { if(e.textContent.includes('No open positions')) e.innerHTML = '<span>No open positions</span>'; });
  }
  document.addEventListener('click', e => { if(e.target.closest('.accountTabs button')) setTimeout(render, 0); }, true);
  setInterval(render, 1800);
  setTimeout(render, 500);
})();