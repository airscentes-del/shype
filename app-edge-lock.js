(() => {
  window.SHYPE_WALLETCONNECT_PROJECT_ID = window.SHYPE_WALLETCONNECT_PROJECT_ID || '56121115b23e4a5a565c3ae7977b37cc';

  const nativeSetInterval = window.setInterval.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  window.setInterval = (handler, timeout, ...args) => {
    const src = document.currentScript?.src || '';
    if (src.includes('app-wallet-next.js')) return 0;
    if (src.includes('app-upgrade.js') && Number(timeout) >= 2000) return 0;
    return nativeSetInterval(handler, timeout, ...args);
  };
  window.setTimeout = (handler, timeout, ...args) => {
    const src = document.currentScript?.src || '';
    if (src.includes('app-wallet-next.js')) return 0;
    return nativeSetTimeout(handler, timeout, ...args);
  };

  const style = document.createElement('style');
  style.textContent = `
    html,body,.appShell,.terminalMain,.appView{width:100%;max-width:100%;overflow-x:hidden!important;overscroll-behavior-x:none!important;}
    html,body{background:#071722!important;}
    body{position:relative;touch-action:pan-y pinch-zoom;-webkit-overflow-scrolling:touch;}
    .appShell{overscroll-behavior:none;contain:layout paint;}
    .terminalTopbar,.marketHeader,.chartModule,.tradeTicket,.positionPanel,.mobileNav{max-width:100vw!important;overflow-x:hidden!important;}
    .chartFrame,.chartFrame iframe{max-width:100vw!important;overflow:hidden!important;}
    .marketModeTabs,.quoteTabs,.accountTabs,.positionTabs{overscroll-behavior-x:contain!important;}
    .ticketAction[data-open-demo],button[data-open-demo],#buyButton,.buyButton{display:none!important;pointer-events:none!important;}
    .emptyState button[data-view="markets"]{display:none!important;}
    .accountSheet.compact .primaryWide{display:none!important;}
    .walletSlider input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;background:linear-gradient(90deg,#58caff 0%,#58caff var(--p,0%),rgba(145,211,239,.25) var(--p,0%),rgba(145,211,239,.25) 100%)!important;outline:none;}
    .walletSlider input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#58caff;border:3px solid #071722;box-shadow:0 0 0 1px rgba(88,202,255,.65),0 4px 14px rgba(0,0,0,.4);}
    .walletSlider input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#58caff;border:3px solid #071722;}
    .shypeEdgeBlock{position:fixed;top:0;bottom:0;width:18px;z-index:2147483000;pointer-events:auto;background:transparent;touch-action:none;}
    .shypeEdgeBlock.left{left:0}.shypeEdgeBlock.right{right:0}
  `;
  document.head.appendChild(style);

  document.addEventListener('click', event => {
    const demoButton = event.target.closest?.('[data-open-demo],#buyButton,.buyButton');
    if (!demoButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
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

  function addScript(src, attr) {
    if (document.querySelector(`script[${attr}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(attr, 'true');
    document.body.appendChild(script);
  }

  function loadConnectModule() {
    addScript('assets/walletconnect-logo-data.js?v=20260601-01', 'data-shype-wc-logo-data');
    addScript('app-connect-fix.js?v=20260601-05', 'data-shype-connect-fix');
    addScript('app-wallet-live.js?v=20260601-03', 'data-shype-wallet-live');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadConnectModule);
  else loadConnectModule();
})();