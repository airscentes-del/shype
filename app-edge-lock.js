(() => {
  const style = document.createElement('style');
  style.textContent = `
    html,
    body,
    .appShell,
    .terminalMain{
      width:100%;
      max-width:100%;
      overflow-x:hidden!important;
      overscroll-behavior-x:none!important;
    }
    body{
      position:relative;
      touch-action:pan-y pinch-zoom;
      -webkit-overflow-scrolling:touch;
    }
    .appShell{
      overscroll-behavior:none;
      contain:layout paint;
    }
    .terminalMain,
    .appView{
      transform:translateZ(0);
    }
  `;
  document.head.appendChild(style);

  let startX = 0;
  let startY = 0;
  let lockEdgeSwipe = false;
  const edgeSize = 28;
  const horizontalThreshold = 10;

  function isEditable(target) {
    return Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
  }

  document.addEventListener('touchstart', event => {
    if (!event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    const width = window.innerWidth || document.documentElement.clientWidth;
    lockEdgeSwipe = !isEditable(event.target) && (startX <= edgeSize || startX >= width - edgeSize);
  }, { passive: true });

  document.addEventListener('touchmove', event => {
    if (!lockEdgeSwipe || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const mostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold;
    if (mostlyHorizontal) event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    lockEdgeSwipe = false;
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    lockEdgeSwipe = false;
  }, { passive: true });
})();