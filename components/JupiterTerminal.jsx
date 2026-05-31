"use client";

import { useEffect, useRef, useState } from 'react';

const SOL = 'So11111111111111111111111111111111111111112';
const USDC = 'EPjFWdd5AufqSSqeM2qmqpcJc8G4wEGGkZwyTDt1v';

export default function JupiterTerminal() {
  const [status, setStatus] = useState('Loading Jupiter swap terminal...');
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    function startTerminal() {
      if (!window.Jupiter) {
        setStatus('Jupiter terminal script loaded, waiting for init...');
        setTimeout(startTerminal, 400);
        return;
      }

      try {
        window.Jupiter.init({
          displayMode: 'integrated',
          integratedTargetId: 'jupiter-terminal',
          endpoint: 'https://api.mainnet-beta.solana.com',
          strictTokenList: false,
          formProps: {
            initialInputMint: SOL,
            initialOutputMint: USDC
          }
        });
        setStatus('');
      } catch (error) {
        console.warn(error);
        setStatus('Jupiter terminal could not be initialized in this browser.');
      }
    }

    if (document.getElementById('jupiter-terminal-script')) {
      startTerminal();
      return;
    }

    const script = document.createElement('script');
    script.id = 'jupiter-terminal-script';
    script.src = 'https://terminal.jup.ag/main-v4.js';
    script.async = true;
    script.onload = startTerminal;
    script.onerror = () => setStatus('Jupiter terminal script could not be loaded.');
    document.body.appendChild(script);
  }, []);

  return (
    <div className="jupiterTerminalShell">
      <div id="jupiter-terminal" className="jupiterTerminalTarget">
        {status && <div className="terminalStatus">{status}</div>}
      </div>
    </div>
  );
}
