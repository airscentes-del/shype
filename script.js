const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

document.querySelectorAll('[data-disabled-action]').forEach(button => {
  button.addEventListener('click', () => {
    alert('This module is a clean pre-launch interface. Real routing will be added after wallet/protocol integration.');
  });
});

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
