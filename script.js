const views = document.querySelectorAll('.view');
const viewButtons = document.querySelectorAll('[data-view]');
const navItems = document.querySelectorAll('.navItem');
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const STORAGE_KEY = 'shypeTrackedTokens';
const DRAFT_KEY = 'shypeLaunchDraft';

const DEFAULT_TOKENS = [
  { name: 'Solana', ticker: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, native: true },
  { name: 'USD Coin', ticker: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qmqpcJc8G4wEGGkZwyTDt1v', decimals: 6 },
  { name: 'Jupiter', ticker: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
  { name: 'Bonk', ticker: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3m4ftxX9nkPqj3H6cV7Xk5J8N', decimals: 5 }
];

let connectedWallet = null;
let connectedProvider = null;
let selectedToken = null;
let currentQuote = null;
let portfolio = { sol: null, tokenAccounts: null };

function shortAddress(address) {
  if (!address) return 'Not connected';
  return address.slice(0, 4) + '...' + address.slice(-4);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setMessage(id, message, color = '') {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.style.color = color;
}

function getTokens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { return []; }
}

function allTokens() {
  const stored = getTokens();
  const seen = new Set();
  return [...DEFAULT_TOKENS, ...stored].filter(token => {
    if (seen.has(token.mint)) return false;
    seen.add(token.mint);
    return true;
  });
}

function saveTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  renderTokens();
  populateSwapSelectors();
}

function updateSelectedToken(token) {
  selectedToken = token;
  setText('selectedTokenText', token ? `${token.name} (${token.ticker}) · ${shortAddress(token.mint)}` : 'No token selected. Add one under Tokens.');
  if (token) {
    const swapTo = document.getElementById('swapTo');
    if (swapTo) swapTo.value = token.mint;
  }
}

function renderTokens() {
  const tokens = getTokens();
  setText('trackedStatus', String(tokens.length));
  const list = document.getElementById('tokenList');
  if (!list) return;
  if (!tokens.length) {
    list.innerHTML = '<div class="emptyList">No custom tokens added yet. Default markets are already available in Swap.</div>';
    updateSelectedToken(null);
    return;
  }
  list.innerHTML = tokens.map((token, index) => `
    <div class="tokenRow">
      <div><h4>${escapeHtml(token.name)} <small>${escapeHtml(token.ticker)}</small></h4><p>${escapeHtml(token.mint)}</p></div>
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
      populateSwapSelectors();
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

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function populateSwapSelectors() {
  const from = document.getElementById('swapFrom');
  const to = document.getElementById('swapTo');
  if (!from || !to) return;
  const tokens = allTokens();
  const options = tokens.map(token => `<option value="${token.mint}">${token.ticker}</option>`).join('');
  const oldFrom = from.value || DEFAULT_TOKENS[0].mint;
  const oldTo = selectedToken?.mint || to.value || DEFAULT_TOKENS[1].mint;
  from.innerHTML = options;
  to.innerHTML = options;
  from.value = tokens.some(token => token.mint === oldFrom) ? oldFrom : DEFAULT_TOKENS[0].mint;
  to.value = tokens.some(token => token.mint === oldTo) ? oldTo : DEFAULT_TOKENS[1].mint;
}

function tokenByMint(mint) {
  return allTokens().find(token => token.mint === mint) || { name: 'Unknown', ticker: 'TOKEN', mint, decimals: 6 };
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
}

viewButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

function getWalletProviders() {
  const candidates = [];
  const add = (name, provider) => {
    if (!provider || candidates.some(item => item.provider === provider)) return;
    candidates.push({ name, provider });
  };
  add('Phantom', window.phantom?.solana);
  add('Solflare', window.solflare);
  add('Backpack', window.backpack?.solana);
  add('Glow', window.glow?.solana);
  add('OKX Wallet', window.okxwallet?.solana);
  add('Coinbase Wallet', window.coinbaseSolana);
  add('Detected Solana Wallet', window.solana);
  return candidates.filter(item => item.provider && (item.provider.connect || item.provider.isPhantom || item.provider.isSolflare));
}

function openWalletModal() {
  const modal = document.getElementById('walletModal');
  const list = document.getElementById('walletList');
  if (!modal || !list) return;
  const wallets = getWalletProviders();
  if (!wallets.length) {
    list.innerHTML = '<div class="emptyList">No Solana wallet detected. Open this page in Phantom, Solflare, Backpack, Glow, OKX or another Solana wallet browser.</div>';
  } else {
    list.innerHTML = wallets.map((wallet, index) => `<button class="walletOption" type="button" data-wallet="${index}"><span>${wallet.name}</span><small>Connect</small></button>`).join('');
    document.querySelectorAll('[data-wallet]').forEach(button => {
      button.addEventListener('click', async () => {
        const wallet = wallets[Number(button.dataset.wallet)];
        await connectProvider(wallet.provider);
        closeWalletModal();
      });
    });
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeWalletModal() {
  const modal = document.getElementById('walletModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

async function connectProvider(provider) {
  const response = await provider.connect();
  const publicKey = response?.publicKey || provider.publicKey;
  if (!publicKey) throw new Error('Wallet did not return a public key');
  const key = publicKey.toString();
  connectedWallet = key;
  connectedProvider = provider;
  const walletButton = document.getElementById('walletButton');
  walletButton.textContent = shortAddress(key);
  await loadPortfolio(key);
}

function toBase64(uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function getJupiterQuote() {
  currentQuote = null;
  const fromMint = document.getElementById('swapFrom').value;
  const toMint = document.getElementById('swapTo').value;
  const amountValue = Number(document.getElementById('swapAmount').value);
  const fromToken = tokenByMint(fromMint);
  const toToken = tokenByMint(toMint);
  if (!amountValue || amountValue <= 0) {
    setMessage('swapNote', 'Enter a valid amount.', '#ff6675');
    return;
  }
  if (fromMint === toMint) {
    setMessage('swapNote', 'Choose two different tokens.', '#ff6675');
    return;
  }
  const amount = Math.round(amountValue * Math.pow(10, fromToken.decimals || 6));
  setMessage('swapNote', 'Loading Jupiter quote…', '');
  document.getElementById('quoteBox').textContent = 'Requesting route…';
  try {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(fromMint)}&outputMint=${encodeURIComponent(toMint)}&amount=${amount}&slippageBps=75`;
    const response = await fetch(url);
    const quote = await response.json();
    if (!quote?.outAmount) throw new Error('No route returned');
    currentQuote = quote;
    const out = Number(quote.outAmount) / Math.pow(10, toToken.decimals || 6);
    document.getElementById('swapOut').value = out.toFixed(6);
    document.getElementById('quoteBox').textContent = `${amountValue} ${fromToken.ticker} → ${out.toFixed(6)} ${toToken.ticker}. Price impact: ${quote.priceImpactPct || '0'}%.`;
    setMessage('swapNote', 'Quote ready. Review it, then sign with wallet.', '#64f4cc');
  } catch (error) {
    document.getElementById('quoteBox').textContent = 'No route available or quote API unavailable.';
    setMessage('swapNote', 'Quote failed. Try another token pair or amount.', '#ff6675');
  }
}

async function executeSwap() {
  if (!connectedWallet || !connectedProvider) {
    openWalletModal();
    setMessage('swapNote', 'Connect wallet first.', '#ff6675');
    return;
  }
  if (!currentQuote) {
    setMessage('swapNote', 'Get a quote first.', '#ff6675');
    return;
  }
  if (!window.solanaWeb3?.VersionedTransaction) {
    setMessage('swapNote', 'Solana transaction library not loaded. Refresh and try again.', '#ff6675');
    return;
  }
  setMessage('swapNote', 'Preparing wallet transaction…', '');
  try {
    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteResponse: currentQuote, userPublicKey: connectedWallet, wrapAndUnwrapSol: true })
    });
    const data = await response.json();
    if (!data.swapTransaction) throw new Error(data.error || 'No swap transaction returned');
    const raw = Uint8Array.from(atob(data.swapTransaction), char => char.charCodeAt(0));
    const tx = window.solanaWeb3.VersionedTransaction.deserialize(raw);
    const signed = await connectedProvider.signTransaction(tx);
    const signature = await rpc('sendTransaction', [toBase64(signed.serialize()), { encoding: 'base64', skipPreflight: false, maxRetries: 3 }]);
    setMessage('swapNote', 'Swap sent: ' + shortAddress(signature), '#64f4cc');
    currentQuote = null;
  } catch (error) {
    setMessage('swapNote', 'Swap not sent: ' + (error.message || 'wallet rejected or transaction failed'), '#ff6675');
  }
}

const addToken = document.getElementById('addToken');
if (addToken) {
  addToken.addEventListener('click', () => {
    const name = document.getElementById('tokenName').value.trim();
    const ticker = document.getElementById('tokenTicker').value.trim().toUpperCase();
    const mint = document.getElementById('tokenMint').value.trim();
    const decimals = Number(document.getElementById('tokenDecimals')?.value || 6);
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
    tokens.unshift({ name, ticker, mint, decimals: Number.isFinite(decimals) ? decimals : 6 });
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
    const draft = {
      name: document.getElementById('launchName')?.value.trim(),
      ticker: document.getElementById('launchTicker')?.value.trim().toUpperCase(),
      description: document.getElementById('launchDescription')?.value.trim(),
      x: document.getElementById('launchX')?.value.trim(),
      website: document.getElementById('launchWebsite')?.value.trim(),
      community: document.getElementById('launchCommunity')?.value.trim(),
      routing: document.getElementById('launchEvent')?.value || 'main',
      preparedAt: new Date().toISOString()
    };
    const result = document.getElementById('launchResult');
    if (!draft.name || !draft.ticker) {
      result.textContent = 'Add token name and ticker first.';
      result.style.color = '#ff6675';
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    result.textContent = `${draft.name} (${draft.ticker}) draft saved locally. Open Pump.fun and paste the details there.`;
    result.style.color = '#64f4cc';
  });
}

const openPump = document.getElementById('openPump');
if (openPump) openPump.addEventListener('click', () => window.open('https://pump.fun/create', '_blank', 'noopener,noreferrer'));

const launchImage = document.getElementById('launchImage');
if (launchImage) {
  launchImage.addEventListener('change', event => {
    const file = event.target.files?.[0];
    const preview = document.getElementById('imagePreview');
    if (!file || !preview) return;
    if (file.size > 5 * 1024 * 1024) {
      preview.textContent = 'Image is too large. Use max 5 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { preview.innerHTML = `<img src="${reader.result}" alt="Token preview" />`; };
    reader.readAsDataURL(file);
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
if (openPerpsVenue) openPerpsVenue.addEventListener('click', () => {
  const venue = document.getElementById('perpsVenue')?.value || 'jupiter';
  window.open(venue === 'jupiter' ? 'https://jup.ag/perps' : 'https://app.drift.trade', '_blank', 'noopener,noreferrer');
});

const walletButton = document.getElementById('walletButton');
walletButton.addEventListener('click', openWalletModal);
document.getElementById('closeWalletModal')?.addEventListener('click', closeWalletModal);
document.getElementById('walletModal')?.addEventListener('click', event => { if (event.target.id === 'walletModal') closeWalletModal(); });
document.getElementById('getQuote')?.addEventListener('click', getJupiterQuote);
document.getElementById('executeSwap')?.addEventListener('click', executeSwap);
document.getElementById('switchSwap')?.addEventListener('click', () => {
  const from = document.getElementById('swapFrom');
  const to = document.getElementById('swapTo');
  const temp = from.value;
  from.value = to.value;
  to.value = temp;
  currentQuote = null;
  document.getElementById('swapOut').value = '';
  document.getElementById('quoteBox').textContent = 'Tokens switched. Request a new quote.';
});

document.querySelectorAll('[data-soon]').forEach(button => button.addEventListener('click', () => alert('This module needs a real protocol/SDK integration before it can go live.')));

window.addEventListener('load', async () => {
  renderTokens();
  populateSwapSelectors();
  const hash = location.hash.replace('#', '');
  showView(hash || 'overview');
});
