import WalletManagerTron, { WalletAccountTron } from '@tetherto/wdk-wallet-tron'

export interface PrivateSendOptions {
  /** The token's address. */
  token: string
  /** The recipient's Tron address. */
  recipient: string
  /** The amount to send, in base units. */
  amount: bigint | number | string
}

export interface StuckUtxoBalance {
  /** The token's address. */
  token: string
  /** The recoverable shielded balance, in base units. */
  balance: bigint
}

/** A Tron wallet account with Hinkal private-transfer support. */
export class WalletAccountTronHinkal extends WalletAccountTron {
  /** Sends a TRC-20 token to another address privately through Hinkal. */
  privateSend (options: PrivateSendOptions): Promise<{ hash: string }>
  /** Withdraws this account's stuck Hinkal UTXOs of a token back to its own address. */
  withdrawStuckUtxos (options: { token: string }): Promise<{ hashes: string[] }>
  /** Returns this account's stuck Hinkal shielded balances. */
  stuckUtxoBalances (): Promise<StuckUtxoBalance[]>
}

/** A wallet manager for Tron whose accounts support Hinkal private transfers. */
export default class WalletManagerTronHinkal extends WalletManagerTron {
  getAccount (index?: number): Promise<WalletAccountTronHinkal>
  getAccountByPath (path: string): Promise<WalletAccountTronHinkal>
}
