const views = document.querySelectorAll('.view');
const viewButtons = document.querySelectorAll('[data-view]');
const navItems = document.querySelectorAll('.navItem');
let jupiterLoaded = false;

function showView(id) {
  const target = document.getElementById(id) ? id : 'overview';
  views.forEach(view => view.classList.toggle('active', view.id === target));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.view === target));
  history.replaceState(null, '', target === 'overview' ? location.pathname : '#' + target);
  if (target === 'swap') loadJupiterTerminal();
}

viewButtons.forEach(button => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

function loadJupiterTerminal() {
  if (jupiterLoaded) return;
  jupiterLoaded = true;

  function init() {
    if (!window.Jupiter) {
      setTimeout(init, 400);
      return;
    }
    try {
      window.Jupiter.init({
        displayMode: 'integrated',
        integratedTargetId: 'jupiter-terminal',
        endpoint: 'https://api.mainnet-beta.solana.com',
        strictTokenList: false,
        formProps: {
          initialInputMint: 'So11111111111111111111111111111111111111112',
          initialOutputMint: 'EPjFWdd5AufqSSqeM2qmqpcJc8G4wEGGkZwyTDt1v'
        }
      });
    } catch (error) {
      const target = document.getElementById('jupiter-terminal');
      if (target) target.innerHTML = '<div class="loading">Jupiter terminal could not be loaded in this browser.</div>';
    }
  }

  const script = document.createElement('script');
  script.src = 'https://terminal.jup.ag/main-v4.js';
  script.async = true;
  script.onload = init;
  script.onerror = () => {
    const target = document.getElementById('jupiter-terminal');
    if (target) target.innerHTML = '<div class="loading">Jupiter terminal script failed to load.</div>';
  };
  document.body.appendChild(script);
}

document.querySelectorAll('[data-soon]').forEach(button => {
  button.addEventListener('click', () => alert('This module needs a real protocol/SDK integration before it can go live.'));
});

const checkLaunch = document.getElementById('checkLaunch');
if (checkLaunch) {
  checkLaunch.addEventListener('click', () => {
    const name = document.getElementById('launchName').value.trim();
    const ticker = document.getElementById('launchTicker').value.trim();
    const mint = document.getElementById('launchMint').value.trim();
    const result = document.getElementById('launchResult');
    if (!name || !ticker || !mint) {
      result.textContent = 'Missing name, ticker or mint.';
      result.style.color = '#ff6675';
      return;
    }
    result.textContent = 'Looks ready for a future SHYPE profile submission.';
    result.style.color = '#64f4cc';
  });
}

const walletButton = document.getElementById('walletButton');
walletButton.addEventListener('click', async () => {
  try {
    if (!window.solana?.isPhantom) {
      alert('Phantom wallet not detected. Install Phantom or open this page in a Solana wallet browser.');
      return;
    }
    const response = await window.solana.connect();
    const key = response.publicKey.toString();
    walletButton.textContent = key.slice(0, 4) + '...' + key.slice(-4);
  } catch (error) {
    console.warn(error);
  }
});

window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '');
  showView(hash || 'overview');
});
