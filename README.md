# wdk-wallet-tron-hinkal

A [WDK](https://docs.wdk.tether.io) community wallet module that adds [Hinkal](https://hinkal.pro)
private transfers to Tron wallet accounts.

It extends [`@tetherto/wdk-wallet-tron`](https://www.npmjs.com/package/@tetherto/wdk-wallet-tron),
so every standard account method keeps working and three Hinkal methods are added on top:

- `privateSend` — shielded deposit and scheduled withdrawal to a recipient in a single call.
- `withdrawStuckUtxos` — recover stranded shielded UTXOs back to your own address.
- `stuckUtxoBalances` — list recoverable shielded balances per token.

## Installation

```sh
npm install @hinkal/wdk-wallet-tron-hinkal
```

> **Note:** This module depends on `@hinkal/common`, which is distributed for bundled
> environments. Use it through a bundler (Vite, webpack, React Native / Metro, or bare) rather
> than plain Node.js ESM.

## Usage

```js
import WalletManagerTronHinkal from '@hinkal/wdk-wallet-tron-hinkal'

const wallet = new WalletManagerTronHinkal(seed, { provider: 'https://api.trongrid.io' })
const account = await wallet.getAccount(0)

// Send 1 USDT privately through Hinkal.
const { hash } = await account.privateSend({
  token: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  recipient: 'T...', // base58 Tron address
  amount: 1_000_000n
})

// Inspect and recover stuck shielded balances.
const balances = await account.stuckUtxoBalances()
if (balances.length > 0) {
  await account.withdrawStuckUtxos({ token: balances[0].token })
}
```

## API

### `account.privateSend({ token, recipient, amount }) => Promise<{ hash }>`

Privately transfers `amount` (base units) of `token` to a `recipient` via Hinkal's
`depositAndWithdraw`. Throws if the recipient is not a valid Tron address, the amount is not
positive, or the token is unsupported.

### `account.withdrawStuckUtxos({ token }) => Promise<{ hashes }>`

Recovers stranded shielded UTXOs of `token` back to the account's own address.

### `account.stuckUtxoBalances() => Promise<Array<{ token, balance }>>`

Returns the recoverable shielded balance per token. An empty array means nothing is stuck.

## License

Apache-2.0
