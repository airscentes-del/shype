(() => {
  window.SHYPE_WALLETCONNECT_PROJECT_ID = window.SHYPE_WALLETCONNECT_PROJECT_ID || '56121115b23e4a5a565c3ae7977b37cc';

  const style = document.createElement('style');
  style.textContent = `
    html,body,.appShell,.terminalMain,.appView{width:100%;max-width:100%;overflow-x:hidden!important;overscroll-behavior-x:none!important;}
    html,body{background:#071722!important;}
    body{position:relative;touch-action:pan-y pinch-zoom;-webkit-overflow-scrolling:touch;}
    .appShell{overscroll-behavior:none;contain:layout paint;}
    .terminalTopbar,.marketHeader,.chartModule,.tradeTicket,.positionPanel,.mobileNav{max-width:100vw!important;overflow-x:hidden!important;}
    .chartFrame,.chartFrame iframe{max-width:100vw!important;overflow:hidden!important;}
    .marketModeTabs,.quoteTabs,.accountTabs,.positionTabs{overscroll-behavior-x:contain!important;}
    .shypeEdgeBlock{position:fixed;top:0;bottom:0;width:18px;z-index:2147483000;pointer-events:auto;background:transparent;touch-action:none;}
    .shypeEdgeBlock.left{left:0}.shypeEdgeBlock.right{right:0}
    .scWcSvg{width:36px;height:36px;display:block}.scAction[data-sc-wc] .scWcIcon{display:none!important}.scAction[data-sc-wc]{cursor:pointer;pointer-events:auto!important}.scAction.isOpening{opacity:.72}.scAction.isOpening span:last-child{color:#bfeeff}
  `;
  document.head.appendChild(style);

  function wcMark() {
    return `<svg class="scWcSvg" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#1d63ff"/><path d="M12.1 17.1a11.2 11.2 0 0 1 15.8 0l.5.5c.2.2.2.6 0 .9l-1.8 1.7c-.2.2-.5.2-.8 0l-.7-.7a7.2 7.2 0 0 0-10.2 0l-.7.7c-.2.2-.5.2-.8 0l-1.8-1.7a.6.6 0 0 1 0-.9l.5-.5Zm19.5 3.7 1.6 1.5c.2.2.2.6 0 .9l-7.2 6.8a.8.8 0 0 1-1.1 0l-5-4.8a.3.3 0 0 0-.4 0l-5 4.8a.8.8 0 0 1-1.1 0l-7.2-6.8a.6.6 0 0 1 0-.9l1.6-1.5a.8.8 0 0 1 1.1 0l5 4.8a.3.3 0 0 0 .4 0l5-4.8a.8.8 0 0 1 1.1 0l5 4.8a.3.3 0 0 0 .4 0l5-4.8a.8.8 0 0 1 1.1 0Z" fill="#fff"/></svg>`;
  }

  function patchConnectSheet() {
    const wcButton = document.querySelector('.scAction[data-sc-wc]');
    if (wcButton && !wcButton.querySelector('.scWcSvg')) {
      const firstCell = wcButton.firstElementChild;
      if (firstCell) firstCell.innerHTML = wcMark();
    }
    const desktopButton = document.querySelector('.scAction[data-sc-desktop]');
    if (desktopButton) desktopButton.style.pointerEvents = 'auto';
  }

  new MutationObserver(patchConnectSheet).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('pointerdown', event => {
    const wcButton = event.target.closest?.('.scAction[data-sc-wc]');
    const desktopButton = event.target.closest?.('.scAction[data-sc-desktop]');
    if (wcButton) {
      patchConnectSheet();
      wcButton.classList.add('isOpening');
      const label = wcButton.querySelector('span:last-child');
      if (label) label.textContent = 'Opening WalletConnect…';
    }
    if (desktopButton) {
      desktopButton.classList.add('isOpening');
      const label = desktopButton.querySelector('span:last-child');
      if (label) label.textContent = 'Checking wallets…';
    }
  }, true);

  ['left','right'].forEach(side => {
    if (document.querySelector(`.shypeEdgeBlock.${side}`)) return;
    const block = document.createElement('div');
    block.className = `shypeEdgeBlock ${side}`;
    block.setAttribute('aria-hidden', 'true');
    block.addEventListener('touchstart', event => event.preventDefault(), { passive: false });
    block.addEventListener('touchmove', event => event.preventDefault(), { passive: false });
    document.body.appendChild(block);
  });

  let startX = 0;
  let startY = 0;
  let edgeGesture = false;
  const edgeSize = 52;
  function editable(target) { return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]')); }
  document.addEventListener('touchstart', event => {
    if (!event.touches || event.touches.length !== 1 || editable(event.target)) return;
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    const width = window.innerWidth || document.documentElement.clientWidth;
    edgeGesture = startX <= edgeSize || startX >= width - edgeSize;
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', event => {
    if (!edgeGesture || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) event.preventDefault();
  }, { passive: false, capture: true });
  document.addEventListener('touchend', () => { edgeGesture = false; }, { passive: true, capture: true });
  document.addEventListener('touchcancel', () => { edgeGesture = false; }, { passive: true, capture: true });

  function loadConnectModule() {
    if (document.querySelector('script[data-shype-connect-module]')) return;
    const script = document.createElement('script');
    script.src = 'app-connect.js?v=20260531-45';
    script.async = false;
    script.dataset.shypeConnectModule = 'true';
    script.addEventListener('load', () => setTimeout(patchConnectSheet, 80));
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadConnectModule);
  else loadConnectModule();
})();