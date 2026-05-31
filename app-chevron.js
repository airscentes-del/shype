(() => {
  const style = document.createElement('style');
  style.textContent = `
    .metricToggle{
      width:42px!important;
      height:42px!important;
      border-radius:11px!important;
      border:1px solid rgba(168,206,224,.22)!important;
      background:rgba(255,255,255,.022)!important;
      color:transparent!important;
      font-size:0!important;
      line-height:0!important;
      position:relative!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.018)!important;
      transition:border-color .16s ease, background .16s ease, box-shadow .16s ease!important;
    }
    .metricToggle::before{
      content:"";
      width:10px;
      height:10px;
      border-right:2px solid #c7d4dc;
      border-bottom:2px solid #c7d4dc;
      position:absolute;
      left:50%;
      top:48%;
      transform:translate(-50%,-50%) rotate(45deg);
      border-radius:1px;
      transition:transform .18s ease,border-color .18s ease;
    }
    .metricToggle.open{
      background:rgba(69,201,255,.055)!important;
      border-color:rgba(69,201,255,.42)!important;
      box-shadow:0 0 0 1px rgba(69,201,255,.08)!important;
    }
    .metricToggle.open::before{
      border-color:#75d9ff;
      transform:translate(-50%,-35%) rotate(225deg);
    }
    @media(max-width:420px){
      .metricToggle{width:38px!important;height:38px!important;border-radius:10px!important;}
      .metricToggle::before{width:9px;height:9px;border-width:2px;}
    }
  `;
  document.head.appendChild(style);

  function cleanToggleText() {
    document.querySelectorAll('.metricToggle').forEach(button => {
      button.setAttribute('aria-label', button.classList.contains('open') ? 'Hide market details' : 'Show market details');
    });
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.metricToggle')) setTimeout(cleanToggleText, 0);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanToggleText);
  else cleanToggleText();
})();