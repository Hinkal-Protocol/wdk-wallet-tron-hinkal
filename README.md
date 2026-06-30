# @hinkal/wdk-wallet-tron-hinkal

Adds [Hinkal] private transfer support to Tron wallets built with [WDK](https://docs.wdk.tether.io).

Hinkal is a privacy protocol that shields token transfers on-chain. This package wraps `@tetherto/wdk-wallet-tron` and adds three methods to every account:

- **`privateSend`** — send tokens to any address privately. The transfer is shielded through Hinkal so the link between sender and recipient is hidden on-chain.
- **`withdrawStuckUtxos`** — recover any shielded balances that got stuck in Hinkal back to your own address.
- **`stuckUtxoBalances`** — check how much shielded balance is recoverable per token.

All existing WDK wallet methods work unchanged.

## Installation

```sh
npm install @hinkal-wdk-modules/wdk-wallet-tron-hinkal
```

## Usage

```js
import WalletManagerTronHinkal from "@hinkal-wdk-modules/wdk-wallet-tron-hinkal";

const wallet = new WalletManagerTronHinkal(seed, {
  provider: "https://api.trongrid.io",
});
const account = await wallet.getAccount(0);

// Send tokens privately through Hinkal
const { hash } = await account.privateSend({
  token: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // USDT on Tron
  recipient: "T...", // base58 Tron address
  amount: 1_000_000n, // 1 USDT in base units
});
```

> Requires a bundler (Vite, webpack, Metro, or bare) — `@hinkal/common` is not plain Node.js ESM compatible.

## License

Apache-2.0
