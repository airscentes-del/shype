import JupiterTerminal from '../../components/JupiterTerminal';

export default function SwapPage() {
  return (
    <section className="screen">
      <div className="screenHead">
        <p className="eyebrow">Swap</p>
        <h1>Swap inside SHYPE</h1>
        <p>Wallet-signed Jupiter swaps embedded directly in the SHYPE app. Users keep custody and confirm transactions in their own wallet.</p>
      </div>

      <div className="tradeGrid swapTerminalGrid">
        <article className="tradeTicket terminalTicket">
          <JupiterTerminal />
        </article>

        <aside className="moduleCard tallCard">
          <h2>Live swap module</h2>
          <p>This is not a redirect card. The Jupiter terminal is loaded inside SHYPE and connects to the user wallet for signing.</p>
          <ul><li>Jupiter handles routing.</li><li>User signs in wallet.</li><li>SHYPE does not custody funds.</li><li>Integrator fee routing can be added later.</li></ul>
        </aside>
      </div>
    </section>
  );
}
