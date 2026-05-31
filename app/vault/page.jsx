export default function VaultPage() {
  return (
    <section className="screen">
      <div className="screenHead">
        <p className="eyebrow">Vault</p>
        <h1>Routing model</h1>
        <p>Values stay empty until real accounts exist. This screen is the future reporting view for SHYPE protocol revenue.</p>
      </div>
      <div className="vaultLayout">
        <article className="vaultDonut"><div className="donut"><span>0 SOL<small>active</small></span></div></article>
        <article className="moduleCard feeTable">
          <div><span>SHYPE buyback and burn</span><strong>40 percent</strong></div>
          <div><span>Liquidity support</span><strong>25 percent</strong></div>
          <div><span>Operations treasury</span><strong>25 percent</strong></div>
          <div><span>Community vault</span><strong>10 percent</strong></div>
          <p>No fake revenue. This page activates only after real wallets and integrations exist.</p>
        </article>
      </div>
    </section>
  );
}
