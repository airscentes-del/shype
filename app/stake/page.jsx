export default function StakePage() {
  return (
    <section className="screen">
      <div className="screenHead"><p className="eyebrow">Stake</p><h1>Stake-to-support</h1><p>Staking stays locked until SHYPE has a reviewed token and vault design. No fake APY and no fake rewards.</p></div>
      <div className="tradeGrid">
        <article className="tradeTicket"><label>Token mint<input placeholder="Paste launched token mint" /></label><label>Amount<input placeholder="0.00" /></label><button className="primaryAction fullWidth" type="button">Staking not live yet</button><p className="formNote">This screen is a real app section, but staking will only activate after token and vault review.</p></article>
        <aside className="moduleCard tallCard"><h2>Purpose</h2><ul><li>Community lock badge</li><li>Trust score for launched tokens</li><li>Future variable vault claims from real fees only</li><li>No fixed APY wording</li></ul></aside>
      </div>
    </section>
  );
}
