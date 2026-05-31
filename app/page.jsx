import Link from 'next/link';

const status = [
  ['Network', 'Solana'],
  ['Wallet', 'User signed'],
  ['Token', 'Pre-launch'],
  ['Custody', 'None']
];

const flows = [
  ['Swap', 'Jupiter terminal embedded in-app.', '/swap'],
  ['Perps', 'Venue routing now. Deeper integration next.', '/perps'],
  ['Launch', 'Submit Pump.fun mints for SHYPE profiles.', '/launch'],
  ['Vault', 'Routing model without fake balances.', '/vault']
];

export default function OverviewPage() {
  return (
    <section className="screen">
      <div className="dashboardHero">
        <div className="heroCopy">
          <p className="eyebrow">SHYPE terminal</p>
          <h1>Solana meme trading, routed through one interface.</h1>
          <p className="leadText">Swap in-app, route perps, submit launches and keep fee routing transparent. No fake charts. No fake activity. Wallet-signed execution only.</p>
          <div className="actionRow">
            <Link className="primaryAction" href="/swap">Open swap</Link>
            <Link className="secondaryAction" href="/launch">Submit launch</Link>
          </div>
        </div>
        <div className="signalPanel">
          {status.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="flowGrid">
        {flows.map(([title, text, href], index) => (
          <Link className="flowCard" href={href} key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
