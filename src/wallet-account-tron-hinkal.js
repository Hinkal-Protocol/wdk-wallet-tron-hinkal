// Copyright 2026 Hinkal Protocol
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

import { WalletAccountTron } from "@tetherto/wdk-wallet-tron";
import {
  getERC20Token,
  createTronWeb,
  normalizeTronPrivateKey,
  detectTronChainIdFromHost,
  setHinkalTronChainId,
} from "@hinkal/common";
import { prepareTronHinkal } from "@hinkal/common/providers/prepareTronHinkal";

/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */

/**
 * @typedef {Object} StuckUtxoBalance
 * @property {string} token - The token's address.
 * @property {bigint} balance - The recoverable shielded balance, in base units.
 */

/**
 * A Tron wallet account with Hinkal private-transfer support.
 *
 * Extends the standard {@link WalletAccountTron} with private sends and recovery of
 * stranded shielded UTXOs through the Hinkal protocol.
 */
export default class WalletAccountTronHinkal extends WalletAccountTron {
  /**
   * Resolves the Tron chain id from the connected provider's host, mirroring how the
   * EVM module derives its chain from the live provider instead of a build-time flag.
   * Syncs Hinkal's active Tron chain so the SDK (which reads the module-level
   * currentTronChainId) operates on the same network the wallet is connected to.
   *
   * @private
   * @returns {number} The detected Tron chain id (mainnet or Nile).
   * @throws {Error} If the wallet is not connected to tron web.
   */
  _resolveChainId() {
    if (!this._tronWeb) {
      throw new Error("The wallet must be connected to tron web.");
    }
    const chainId = detectTronChainIdFromHost(this._tronWeb.fullNode.host);
    setHinkalTronChainId(chainId);
    return chainId;
  }

  /**
   * Prepares a Hinkal session funded by this account on the connected Tron chain.
   * Builds the signerAdapter bridge between this wallet's HDKey and Hinkal's TronProviderAdapter.
   *
   * @private
   * @returns {Promise<import('@hinkal/common').Hinkal<unknown>>} The initialized Hinkal session.
   * @throws {Error} If the wallet is not connected to tron web.
   */
  async _prepareHinkal() {
    const chainId = this._resolveChainId();
    const privateKey = normalizeTronPrivateKey(
      Buffer.from(this._account.privateKey).toString("hex"),
    );
    const tronWeb = createTronWeb(chainId);

    const signerAdapter = {
      on() {
        return this;
      },
      off() {
        return this;
      },
      async signTransaction(transaction) {
        return await tronWeb.trx.sign(transaction, privateKey);
      },
      async signMessage(message) {
        return await tronWeb.trx.signMessageV2(message, privateKey);
      },
    };

    return await prepareTronHinkal({
      address: await this.getAddress(),
      signerAdapter,
    });
  }

  /**
   * Validates token support and prepares a Hinkal session for the current Tron chain.
   *
   * @private
   * @param {string} token - The token address to validate.
   * @returns {Promise<{ hinkal: import('@hinkal/common').Hinkal<unknown>, erc20Token: object }>}
   * @throws {Error} If the wallet is not connected to tron web.
   * @throws {Error} If the token is not supported by Hinkal on the current chain.
   */
  async _prepareHinkalForToken(token) {
    const chainId = this._resolveChainId();
    const erc20Token = getERC20Token(token, chainId);

    if (!erc20Token) {
      throw new Error(
        `The token ${token} is not supported by Hinkal on chain ${chainId}.`,
      );
    }
    const hinkal = await this._prepareHinkal();
    return { hinkal, erc20Token };
  }

  /**
   * Sends a TRC-20 token to another address privately through Hinkal.
   *
   * @param {TransferOptions} options - The transfer's options (`amount` in base units).
   * @returns {Promise<{ hash: string }>} The transfer's result.
   * @throws {Error} If the recipient address is invalid.
   * @throws {Error} If the amount is not positive.
   * @throws {Error} If the wallet is not connected to tron web.
   * @throws {Error} If the token is not supported by Hinkal on the current chain.
   */
  async privateSend({ token, recipient, amount }) {
    if (!this._tronWeb) {
      throw new Error("The wallet must be connected to tron web.");
    }
    if (!this._tronWeb.isAddress(recipient)) {
      throw new Error("Invalid Tron recipient address.");
    }
    const parsedAmount = BigInt(amount);
    if (parsedAmount <= 0n) {
      throw new Error("Amount must be positive.");
    }
    const { hinkal, erc20Token } = await this._prepareHinkalForToken(token);
    const hash = await hinkal.depositAndWithdraw(
      erc20Token,
      [parsedAmount],
      [recipient],
    );
    return { hash };
  }

  /**
   * Withdraws this account's stuck Hinkal UTXOs of a token back to its own address.
   *
   * @param {{ token: string }} options - The options (only `token` is used).
   * @returns {Promise<{ hashes: string[] }>} The withdrawal transactions' hashes.
   * @throws {Error} If the wallet is not connected to tron web.
   * @throws {Error} If the token is not supported by Hinkal on the current chain.
   */
  async withdrawStuckUtxos({ token }) {
    const { hinkal, erc20Token } = await this._prepareHinkalForToken(token);
    const recipient = await this.getAddress();
    const hashes = await hinkal.withdrawStuckUtxos(erc20Token, recipient);
    return { hashes };
  }

  /**
   * Returns this account's stuck Hinkal shielded balances (UTXOs awaiting recovery).
   *
   * @returns {Promise<StuckUtxoBalance[]>} The stuck balance per token.
   * @throws {Error} If the wallet is not connected to tron web.
   */
  async stuckUtxoBalances() {
    const chainId = this._resolveChainId();
    const hinkal = await this._prepareHinkal();
    const balances = await hinkal.getStuckShieldedBalances(chainId);
    return balances.map(({ token, balance }) => ({
      token: token.erc20TokenAddress,
      balance,
    }));
  }
}
