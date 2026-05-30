const CONFIG = {
  tokenAddress: '', // After launch: paste the real SHYPE Solana mint here.
  dexscreenerBase: 'https://api.dexscreener.com/latest/dex/tokens/',
  buyLink: 'https://pump.fun',
  docsLink: '#docs'
};

const feeSplit = [
  { label: 'Token Liquidity Vault', detail: 'Builds liquidity for the launched token.', percent: 40, color: '#71f7ce' },
  { label: 'SHYPE Buyback / Burn', detail: 'Routes value back into the platform flywheel.', percent: 25, color: '#37d8ff' },
  { label: 'Community Staking Vault', detail: 'Variable vault rewards for stake-to-support holders.', percent: 20, color: '#9b5cff' },
  { label: 'Platform Treasury', detail: 'Development, hosting, design, marketing, moderation.', percent: 10, color: '#d8fff3' },
  { label: 'Creator Share', detail: 'Small optional creator incentive in Balanced Mode.', percent: 5, color: '#ff5b6e' }
];

const tokens = [
  {
    symbol: 'SHYPE', name: 'SHYPE Launch', status: 'live', staking: true, graduated: false,
    desc: 'Main platform token powering launch access, trust scoring, buyback/burn routing, and future vault mechanics.',
    cap: '$---', vault: '0.00 SOL', locked: '18.4%', badges: ['Platform', 'Fee Router', 'Stake-to-support']
  },
  {
    symbol: 'HYPU', name: 'hypurliqwid', status: 'live', staking: false, graduated: false,
    desc: 'Demo example of a Pump.fun-style token profile using a minimal perp-feed aesthetic.',
    cap: '$216.6K', vault: '0.41 SOL', locked: '0.0%', badges: ['Pump.fun', 'Demo Feed']
  },
  {
    symbol: 'SLIQ', name: 'Solana Liquidity Meme', status: 'live', staking: true, graduated: false,
    desc: 'Example community-mode launch with no creator drain and routing toward liquidity and staking vaults.',
    cap: '$88.4K', vault: '7.82 SOL', locked: '24.1%', badges: ['Community Mode', 'Staking Active']
  },
  {
    symbol: 'BURN', name: 'Burn Frog', status: 'graduated', staking: true, graduated: true,
    desc: 'Example graduated launch with LP verification, burn tracker, and public vault addresses.',
    cap: '$412.9K', vault: '22.15 SOL', locked: '36.8%', badges: ['Graduated', 'LP Locked', 'Buyback']
  },
  {
    symbol: 'VAULT', name: 'Vault Cat', status: 'live', staking: true, graduated: false,
    desc: 'Example launch focused on community locking, transparent vault routing, and trust score visibility.',
    cap: '$54.2K', vault: '3.40 SOL', locked: '12.9%', badges: ['Vault', 'Trust Score']
  },
  {
    symbol: 'MEME', name: 'Zero Drain Meme', status: 'live', staking: false, graduated: false,
    desc: 'Example creator mode set to 0% creator share, routing launch activity back into the ecosystem.',
    cap: '$31.8K', vault: '1.17 SOL', locked: '5.2%', badges: ['0% Creator', 'Liquidity First']
  }
];

const liveMessages = [
  'fee routed 0.00421 SOL → token liquidity vault',
  'buyback queued 0.00120 SOL → SHYPE flywheel',
  'stake lock detected: 2.4M SLIQ',
  'vault claim snapshot updated',
  'burn route prepared: 0.00084 SOL equivalent',
  'community mode launch verified',
  'LP lock badge refreshed',
  'DEX pair data request completed'
];

function formatUsd(value) {
  if (!value || Number.isNaN(Number(value))) return '$---';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

async function loadDexData() {
  if (!CONFIG.tokenAddress) return;
  try {
    const response = await fetch(CONFIG.dexscreenerBase + CONFIG.tokenAddress);
    const data = await response.json();
    const pair = data?.pairs?.[0];
    if (!pair) return;
    document.getElementById('mainMarketCap').textContent = formatUsd(pair.fdv || pair.marketCap);
    document.getElementById('mainLiquidity').textContent = formatUsd(pair.liquidity?.usd);
    document.getElementById('graduationProgress').textContent = pair.liquidity?.usd ? 'Live' : '0.0%';
    const shype = tokens.find(t => t.symbol === 'SHYPE');
    if (shype) {
      shype.cap = formatUsd(pair.fdv || pair.marketCap);
      renderTokens(currentFilter);
    }
  } catch (error) {
    console.warn('DEX Screener data unavailable:', error);
  }
}

function renderFeeSplit() {
  const list = document.getElementById('feeList');
  list.innerHTML = feeSplit.map(item => `
    <div class="fee-item">
      <span class="swatch" style="color:${item.color}; background:${item.color}"></span>
      <div><b>${item.label}</b><span>${item.detail}</span></div>
      <strong class="fee-percent">${item.percent}%</strong>
    </div>
  `).join('');
}

let currentFilter = 'all';
function renderTokens(filter = 'all') {
  currentFilter = filter;
  const grid = document.getElementById('tokenGrid');
  const filtered = tokens.filter(token => {
    if (filter === 'all') return true;
    if (filter === 'staking') return token.staking;
    if (filter === 'graduated') return token.graduated;
    return token.status === filter;
  });

  grid.innerHTML = filtered.map(token => `
    <article class="token-card">
      <div class="token-card-top">
        <div class="token-avatar">${token.symbol.slice(0, 2)}</div>
        <div>
          <h3>$${token.symbol}</h3>
          <p class="muted">${token.name}</p>
        </div>
      </div>
      <p>${token.desc}</p>
      <div class="badges">${token.badges.map(b => `<span class="badge">${b}</span>`).join('')}</div>
      <div class="token-stats">
        <div><small>Market cap</small><b>${token.cap}</b></div>
        <div><small>Vault</small><b>${token.vault}</b></div>
        <div><small>Locked</small><b>${token.locked}</b></div>
        <div><small>Status</small><b>${token.graduated ? 'Graduated' : 'Live'}</b></div>
      </div>
    </article>
  `).join('');
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTokens(tab.dataset.filter);
    });
  });
}

function setupDemoLaunch() {
  const button = document.getElementById('demoLaunchButton');
  button.addEventListener('click', () => {
    const n = tokens.length + 1;
    tokens.unshift({
      symbol: `NEW${n}`,
      name: 'New SHYPE Demo Launch',
      status: 'live', staking: false, graduated: false,
      desc: 'Temporary frontend-only demo profile added locally. Real launches will need wallet and backend integration.',
      cap: '$0', vault: '0.00 SOL', locked: '0.0%', badges: ['New', 'Frontend Demo']
    });
    renderTokens(currentFilter);
    addFeed('demo launch profile created locally');
    location.hash = '#tokens';
  });
}

function drawChart() {
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = (h / 5) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  let x = 24;
  let lastClose = h * 0.68;
  const candleWidth = 8;
  const gap = 8;
  for (let i = 0; i < 42; i++) {
    const drift = Math.sin(i / 5) * 16 - i * 2.1 + (Math.random() - .5) * 28;
    const open = lastClose + (Math.random() - .5) * 28;
    const close = Math.max(42, Math.min(h - 34, open + drift));
    const high = Math.min(open, close) - Math.random() * 26 - 8;
    const low = Math.max(open, close) + Math.random() * 26 + 8;
    const up = close < open;
    ctx.strokeStyle = up ? '#13e6a3' : '#ff5b6e';
    ctx.fillStyle = up ? '#13e6a3' : '#ff5b6e';
    ctx.beginPath(); ctx.moveTo(x + candleWidth / 2, high); ctx.lineTo(x + candleWidth / 2, low); ctx.stroke();
    ctx.fillRect(x, Math.min(open, close), candleWidth, Math.max(2, Math.abs(close - open)));
    lastClose = close;
    x += candleWidth + gap;
  }
}

function addFeed(message) {
  const feed = document.getElementById('liveFeed');
  const row = document.createElement('div');
  row.innerHTML = `<b>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b> · ${message}`;
  feed.prepend(row);
  while (feed.children.length > 10) feed.removeChild(feed.lastChild);
}

function startFeed() {
  liveMessages.slice(0, 5).forEach(msg => addFeed(msg));
  setInterval(() => {
    const msg = liveMessages[Math.floor(Math.random() * liveMessages.length)];
    addFeed(msg);
    const current = parseFloat(document.getElementById('buybackTotal').textContent) || 0;
    document.getElementById('buybackTotal').textContent = `${(current + Math.random() * 0.018).toFixed(3)} SOL`;
  }, 3200);
}

function setupWalletButton() {
  document.getElementById('walletButton').addEventListener('click', () => {
    const hasPhantom = Boolean(window.solana?.isPhantom);
    if (!hasPhantom) {
      alert('Wallet connection is a frontend placeholder. Install Phantom or add Solana wallet integration in the next build.');
      return;
    }
    window.solana.connect().then(() => {
      document.getElementById('walletButton').textContent = 'Wallet Connected';
    }).catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderFeeSplit();
  renderTokens();
  setupTabs();
  setupDemoLaunch();
  setupWalletButton();
  drawChart();
  startFeed();
  loadDexData();
});
