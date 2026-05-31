export default function PerpsPage() {
  return (
    <section className="screen">
      <div className="screenHead"><p className="eyebrow">Perps</p><h1>External leverage routing</h1><p>SHYPE routes users to existing Solana venues first. Deep in-app order flow can be added later with SDK work.</p></div>
      <div className="moduleGrid threeCols">
        <article className="moduleCard marketCard"><span className="tag">Perps</span><h2>Jupiter Perps</h2><p>Open Jupiter's live perps venue for supported markets.</p><a className="primaryAction fullWidth" href="https://jup.ag/perps" target="_blank" rel="noreferrer">Open Jupiter Perps</a></article>
        <article className="moduleCard marketCard"><span className="tag">Perps</span><h2>Drift</h2><p>Open Drift for Solana trading tools.</p><a className="primaryAction fullWidth" href="https://app.drift.trade" target="_blank" rel="noreferrer">Open Drift</a></article>
        <article className="moduleCard riskCard"><span className="tag dangerTag">Risk</span><h2>High-risk trading</h2><p>Leverage trading can cause fast losses. A production integration needs proper terms and venue-specific risk screens.</p></article>
      </div>
    </section>
  );
}
