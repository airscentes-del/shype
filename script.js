const views = document.querySelectorAll('.view');
const viewButtons = document.querySelectorAll('[data-view]');
const navItems = document.querySelectorAll('.navItem');
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
let jupiterLoaded = false;
let connectedWallet = null;
let portfolio = { sol: null, tokenAccounts: null };

function shortAddress(address) {
  if (!address) return 'Not connected';
  return address.slice(0, 4) + '...' + address.slice(-4);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

async function loadPortfolio(address) {
  if (!address) return;
  setText('walletStatus', shortAddress(address));
  setText('perpsWallet', shortAddress(address));
  setText('solStatus', 'Loading');
  setText('perpsSol', 'Loading');
  setText('tokenStatus', 'Loading');
  setText('perpsTokens', 'Loading');

  try {
    const balanceResult = await rpc('getBalance', [address, { commitment: 'confirmed' }]);
    const sol = balanceResult.value / 1_000_000_000;
    portfolio.sol = sol;
    setText('solStatus', sol.toFixed(4) + ' SOL');
    setText('perpsSol', sol.toFixed(4) + ' SOL');
  } catch (error) {
    setText('solStatus', 'RPC error');
    setText('perpsSol', 'RPC error');
  }

  try {
    const tokenResult = await rpc('getTokenAccountsByOwner', [
      address,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    ]);
    const accounts = tokenResult.value || [];
    const nonZero = accounts.filter(item => {
      const amount = item.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      return amount > 0;
    });
    portfolio.tokenAccounts = nonZero.length;
    setText('tokenStatus', String(nonZero.length));
    setText('perpsTokens', String(nonZero.length));
  } catch (error) {
    setText('tokenStatus', 'RPC error');
    setText('perpsTokens', 'RPC error');
  }
}

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
        endpoint: RPC_URL,
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

const preparePerps = document.getElementById('preparePerps');
if (preparePerps) {
  preparePerps.addEventListener('click', () => {
    const note = document.getElementById('perpsNote');
    const market = document.getElementById('perpsMarket')?.value || 'SOL-PERP';
    const leverage = document.getElementById('perpsLeverage')?.value || '2x';
    const collateral = document.getElementById('perpsCollateral')?.value || '0.00';
    if (!connectedWallet) {
      note.textContent = 'Connect wallet first to prepare a perps route.';
      note.style.color = '#ff6675';
      return;
    }
    note.textContent = market + ' route prepared locally: ' + collateral + ' collateral at ' + leverage + '. Direct order signing needs SDK integration.';
    note.style.color = '#64f4cc';
  });
}

const openPerpsVenue = document.getElementById('openPerpsVenue');
if (openPerpsVenue) {
  openPerpsVenue.addEventListener('click', () => {
    const market = document.getElementById('perpsMarket')?.value || 'SOL-PERP';
    const url = market === 'SOL-PERP' ? 'https://jup.ag/perps' : 'https://app.drift.trade';
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

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
    const provider = window.phantom?.solana || window.solana;
    if (!provider?.isPhantom) {
      alert('Phantom wallet not detected. Install Phantom or open this page in a Solana wallet browser.');
      return;
    }
    const response = await provider.connect();
    const key = response.publicKey.toString();
    connectedWallet = key;
    walletButton.textContent = shortAddress(key);
    await loadPortfolio(key);
  } catch (error) {
    console.warn(error);
  }
});

window.addEventListener('load', async () => {
  const hash = location.hash.replace('#', '');
  showView(hash || 'overview');
  try {
    const provider = window.phantom?.solana || window.solana;
    if (provider?.isPhantom) {
      const response = await provider.connect({ onlyIfTrusted: true });
      const key = response.publicKey.toString();
      connectedWallet = key;
      walletButton.textContent = shortAddress(key);
      await loadPortfolio(key);
    }
  } catch (_) {}
});
