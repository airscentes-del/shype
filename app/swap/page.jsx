export default function SwapPage() {
  return (
    <section className="screen">
      <div className="screenHead">
        <p className="eyebrow">Swap</p>
        <h1>Swap through Jupiter</h1>
        <p>SHYPE will use Jupiter for real Solana swaps. For this build, the in-app ticket is prepared and execution is routed to Jupiter until wallet transaction building is added.</p>
      </div>

      <div className="tradeGrid">
        <article className="tradeTicket">
          <label>From<div className="inputGroup"><input value="SOL" readOnly /><input placeholder="0.00" /></div></label>
          <label>To<div className="inputGroup"><input value="USDC" readOnly /><input placeholder="Quote output" readOnly /></div></label>
          <a className="primaryAction fullWidth" href="https://jup.ag/swap/SOL-USDC" target="_blank" rel="noreferrer">Open Jupiter swap</a>
        </article>

        <aside className="moduleCard tallCard">
          <h2>Production path</h2>
          <p>Next step: connect wallet, request Jupiter quotes, build the swap transaction, and let the user sign it. Supported integrator fees can route to a SHYPE fee account later.</p>
          <ul><li>User signs every transaction.</li><li>SHYPE never holds swap funds.</li><li>No fake balances or fills.</li></ul>
        </aside>
      </div>
    </section>
  );
}
