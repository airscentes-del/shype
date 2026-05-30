# SHYPE Launch

Static MVP for **shype.app**.

SHYPE is a liquidity-first Solana meme launchpad concept. The frontend demonstrates:

- SHYPE platform dashboard
- Launch token section with Pump.fun flow
- Token launch feed
- Fee-router pie chart
- Buyback/burn concept
- Stake-to-support vault concept
- Demo live feed and demo chart
- Placeholder DEX Screener integration

## GitHub Pages

1. Open repository settings.
2. Go to **Pages**.
3. Choose **Deploy from a branch**.
4. Select branch **main** and folder **/root**.
5. Save.
6. For the custom domain, use: `shype.app`.

The repository already includes a `CNAME` file for `shype.app`.

## After token launch

Open `script.js` and paste the real SHYPE Solana mint address here:

```js
tokenAddress: ''
```

Then the page can try to pull live data from DEX Screener.

## Important

This is a frontend demo only. It does not mint tokens, route real fees, stake tokens, or execute buybacks. Production features need backend infrastructure, wallet integration, audited contracts/programs, and legal review.
