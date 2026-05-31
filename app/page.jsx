import Link from 'next/link';

const status = [
  ['Token', 'Not launched'],
  ['Execution', 'Wallet signed'],
  ['Custody', 'None'],
  ['Fee accounts', 'Inactive']
];

export default function OverviewPage() {
  return (
    <section className="screen overviewScreen">
      <div className="heroPanel">
        <div className="heroText">
          <p className="eyebrow">Solana interface</p>
          <h1>Trade infrastructure before the token.</h1>
          <p className="leadText">
            SHYPE is being rebuilt as an app, not a landing page: swap routing, perps access, launch submission, stake-to-support and transparent fee routing in separate screens.
          </p>
          <div className="actionRow">
            <Link className="primaryAction" href="/swap">Open swap</Link>
            <Link className="secondaryAction" href="/perps">Open perps</Link>
          </div>
        </div>
        <div className="heroMark">
          <img src="https://raw.githubusercontent.com/airscentes-del/shype/main/IMG_2365.png" alt="SHYPE" />
        </div>
      </div>

      <div className="statusGrid">
        {status.map(([label, value]) => (
          <div className="statBox" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="moduleGrid threeCols">
        <article className="moduleCard">
          <span className="moduleIndex">01</span>
          <h2>Swap</h2>
          <p>Quote and route token swaps through Jupiter. Execution is wallet-signed and non-custodial.</p>
        </article>
        <article className="moduleCard">
          <span className="moduleIndex">02</span>
          <h2>Perps</h2>
          <p>Route users to established perps venues instead of pretending SHYPE runs its own leverage engine.</p>
        </article>
        <article className="moduleCard">
          <span className="moduleIndex">03</span>
          <h2>Vault</h2>
          <p>Show fee routing only when real fee accounts exist. No fake balances, no fake revenue.</p>
        </article>
      </div>
    </section>
  );
}
