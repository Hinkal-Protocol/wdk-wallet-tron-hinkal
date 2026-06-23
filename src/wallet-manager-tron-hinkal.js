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

'use strict'

import WalletManagerTron from '@tetherto/wdk-wallet-tron'

import WalletAccountTronHinkal from './wallet-account-tron-hinkal.js'

/**
 * A wallet manager for Tron whose accounts support Hinkal private transfers.
 */
export default class WalletManagerTronHinkal extends WalletManagerTron {
  /**
   * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountTronHinkal>} The account.
   */
  async getAccountByPath (path) {
    if (!this._accounts[path]) {
      this._accounts[path] = new WalletAccountTronHinkal(this.seed, path, this._config)
    }

    return this._accounts[path]
  }
}
