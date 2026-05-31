export default function LaunchPage() {
  return (
    <section className="screen">
      <div className="screenHead"><p className="eyebrow">Launch</p><h1>Launch externally, submit to SHYPE</h1><p>Until SHYPE has its own launch contracts, creators can launch on Pump.fun and submit a mint for profile, routing and vault tracking.</p></div>
      <div className="tradeGrid">
        <article className="tradeTicket"><label>Token name<input placeholder="Example: Frog Terminal" /></label><label>Ticker<input placeholder="FROG" /></label><label>Pump.fun URL or mint<input placeholder="Paste URL or mint" /></label><button className="primaryAction fullWidth" type="button">Submission preview</button><p className="formNote">Submissions are not stored yet. Backend review comes next.</p></article>
        <aside className="moduleCard tallCard"><h2>Flow</h2><ol><li>Launch on Pump.fun.</li><li>Submit mint to SHYPE.</li><li>Add profile and route.</li><li>Enable vault tracking when fee accounts exist.</li></ol><a className="secondaryAction fullWidth" href="https://pump.fun" target="_blank" rel="noreferrer">Open Pump.fun</a></aside>
      </div>
    </section>
  );
}
