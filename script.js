const views = document.querySelectorAll('.view');
const viewButtons = document.querySelectorAll('[data-view]');
const navItems = document.querySelectorAll('.navItem');
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const STORAGE_KEY = 'shypeTrackedTokens';
let jupiterLoaded = false;
let connectedWallet = null;
let selectedToken = null;
let portfolio = { sol: null, tokenAccounts: null };

function shortAddress(address) {
  if (!address) return 'Not connected';
  return address.slice(0, 4) + '...' + address.slice(-4);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function getTokens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { return []; }
}

function saveTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  renderTokens();
}

function updateSelectedToken(token) {
  selectedToken = token;
  setText('selectedTokenText', token ? `${token.name} (${token.ticker}) · ${shortAddress(token.mint)}` : 'No token selected. Add one under Tokens.');
}

function renderTokens() {
  const tokens = getTokens();
  setText('trackedStatus', String(tokens.length));
  const list = document.getElementById('tokenList');
  if (!list) return;
  if (!tokens.length) {
    list.innerHTML = '<div class="emptyList">No tokens added yet.</div>';
    updateSelectedToken(null);
    return;
  }
  list.innerHTML = tokens.map((token, index) => `
    <div class="tokenRow">
      <div><h4>${token.name} <small>${token.ticker}</small></h4><p>${token.mint}</p></div>
      <div class="tokenActions">
        <button class="tinyButton primary" data-trade-token="${index}" type="button">Trade</button>
        <button class="tinyButton" data-remove-token="${index}" type="button">Remove</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-trade-token]').forEach(button => {
    button.addEventListener('click', () => {
      const token = getTokens()[Number(button.dataset.tradeToken)];
      updateSelectedToken(token);
      showView('swap');
    });
  });
  document.querySelectorAll('[data-remove-token]').forEach(button => {
    button.addEventListener('click', () => {
      const next = getTokens().filter((_, idx) => idx !== Number(button.dataset.removeToken));
      saveTokens(next);
    });
  });
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
    const sol = balanceResult.value / 1000000000;
    portfolio.sol = sol;
    setText('solStatus', sol.toFixed(4) + ' SOL');
    setText('perpsSol', sol.toFixed(4) + ' SOL');
  } catch (error) {
    setText('solStatus', 'RPC error');
    setText('perpsSol', 'RPC error');
  }

  try {
    const tokenResult = await rpc('getTokenAccountsByOwner', [address, { programId: TOKEN_PROGRAM_ID }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
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

viewButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

function loadJupiterTerminal() {
  if (jupiterLoaded) return;
  jupiterLoaded = true;
  function init() {
    if (!window.Jupiter) { setTimeout(init, 400); return; }
    try {
      const formProps = { initialInputMint: 'So11111111111111111111111111111111111111112', initialOutputMint: selectedToken?.mint || 'EPjFWdd5AufqSSqeM2qmqpcJc8G4wEGGkZwyTDt1v' };
      window.Jupiter.init({ displayMode: 'integrated', integratedTargetId: 'jupiter-terminal', endpoint: RPC_URL, strictTokenList: false, formProps });
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

const addToken = document.getElementById('addToken');
if (addToken) {
  addToken.addEventListener('click', () => {
    const name = document.getElementById('tokenName').value.trim();
    const ticker = document.getElementById('tokenTicker').value.trim().toUpperCase();
    const mint = document.getElementById('tokenMint').value.trim();
    const result = document.getElementById('tokenResult');
    if (!name || !ticker || mint.length < 32) {
      result.textContent = 'Add name, ticker and a valid Solana mint.';
      result.style.color = '#ff6675';
      return;
    }
    const tokens = getTokens();
    if (tokens.some(token => token.mint === mint)) {
      result.textContent = 'Token is already on your board.';
      result.style.color = '#ff6675';
      return;
    }
    tokens.unshift({ name, ticker, mint });
    saveTokens(tokens);
    updateSelectedToken(tokens[0]);
    result.textContent = 'Token added. Use Trade to open it in Swap.';
    result.style.color = '#64f4cc';
    document.getElementById('tokenName').value = '';
    document.getElementById('tokenTicker').value = '';
    document.getElementById('tokenMint').value = '';
  });
}

const prepareLaunch = document.getElementById('prepareLaunch');
if (prepareLaunch) {
  prepareLaunch.addEventListener('click', () => {
    const name = document.getElementById('launchName')?.value.trim();
    const ticker = document.getElementById('launchTicker')?.value.trim().toUpperCase();
    const supply = document.getElementById('launchSupply')?.value.trim();
    const mode = document.getElementById('launchEvent')?.value || 'main';
    const result = document.getElementById('launchResult');
    if (!connectedWallet) { result.textContent = 'Connect wallet first to prepare a launch.'; result.style.color = '#ff6675'; return; }
    if (!name || !ticker || !supply) { result.textContent = 'Add token name, ticker and supply.'; result.style.color = '#ff6675'; return; }
    const modeText = mode === 'main' ? 'main route' : mode === 'vote' ? 'community vote route' : 'event winner route';
    result.textContent = `${name} (${ticker}) prepared with ${modeText}. Real mint transaction builder comes next.`;
    result.style.color = '#64f4cc';
  });
}

const preparePerps = document.getElementById('preparePerps');
if (preparePerps) {
  preparePerps.addEventListener('click', () => {
    const note = document.getElementById('perpsNote');
    const venue = document.getElementById('perpsVenue')?.value || 'jupiter';
    const market = document.getElementById('perpsMarket')?.value || 'SOL-PERP';
    const leverage = document.getElementById('perpsLeverage')?.value || '2x';
    const collateral = document.getElementById('perpsCollateral')?.value || '0.00';
    if (!connectedWallet) { note.textContent = 'Connect wallet first to prepare a perps route.'; note.style.color = '#ff6675'; return; }
    note.textContent = `${venue === 'jupiter' ? 'Jupiter Perps' : 'Drift'} route prepared: ${market}, ${collateral} collateral, ${leverage}.`;
    note.style.color = '#64f4cc';
  });
}

const openPerpsVenue = document.getElementById('openPerpsVenue');
if (openPerpsVenue) {
  openPerpsVenue.addEventListener('click', () => {
    const venue = document.getElementById('perpsVenue')?.value || 'jupiter';
    window.open(venue === 'jupiter' ? 'https://jup.ag/perps' : 'https://app.drift.trade', '_blank', 'noopener,noreferrer');
  });
}

document.querySelectorAll('[data-soon]').forEach(button => button.addEventListener('click', () => alert('This module needs a real protocol/SDK integration before it can go live.')));

const walletButton = document.getElementById('walletButton');
walletButton.addEventListener('click', async () => {
  try {
    const provider = window.phantom?.solana || window.solana;
    if (!provider?.isPhantom) { alert('Phantom wallet not detected. Install Phantom or open this page in a Solana wallet browser.'); return; }
    const response = await provider.connect();
    const key = response.publicKey.toString();
    connectedWallet = key;
    walletButton.textContent = shortAddress(key);
    await loadPortfolio(key);
  } catch (error) { console.warn(error); }
});

window.addEventListener('load', async () => {
  renderTokens();
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
