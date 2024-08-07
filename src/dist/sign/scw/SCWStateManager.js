"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCWStateManager = void 0;
const ScopedLocalStorage_1 = require("../../util/ScopedLocalStorage");
const ACCOUNTS_KEY = 'accounts';
const ACTIVE_CHAIN_STORAGE_KEY = 'activeChain';
const AVAILABLE_CHAINS_STORAGE_KEY = 'availableChains';
const WALLET_CAPABILITIES_STORAGE_KEY = 'walletCapabilities';
class SCWStateManager {
    get accounts() {
        return this._accounts;
    }
    get activeChain() {
        return this._activeChain;
    }
    get walletCapabilities() {
        return this._walletCapabilities;
    }
    constructor(params) {
        var _a, _b;
        this.storage = new ScopedLocalStorage_1.ScopedLocalStorage('CBWSDK', 'SCWStateManager');
        this.updateListener = params.updateListener;
        this.availableChains = this.loadItemFromStorage(AVAILABLE_CHAINS_STORAGE_KEY);
        this._walletCapabilities = this.loadItemFromStorage(WALLET_CAPABILITIES_STORAGE_KEY);
        const accounts = this.loadItemFromStorage(ACCOUNTS_KEY);
        const chain = this.loadItemFromStorage(ACTIVE_CHAIN_STORAGE_KEY);
        this._accounts = accounts || [];
        this._activeChain = chain || { id: (_b = (_a = params.appChainIds) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 1 };
    }
    updateAccounts(accounts) {
        this._accounts = accounts;
        this.storeItemToStorage(ACCOUNTS_KEY, accounts);
        this.updateListener.onAccountsUpdate(accounts);
    }
    switchChain(chainId) {
        var _a;
        const chain = (_a = this.availableChains) === null || _a === void 0 ? void 0 : _a.find((chain) => chain.id === chainId);
        if (!chain)
            return false;
        if (chain === this._activeChain)
            return true;
        this._activeChain = chain;
        this.storeItemToStorage(ACTIVE_CHAIN_STORAGE_KEY, chain);
        this.updateListener.onChainUpdate(chain);
        return true;
    }
    updateAvailableChains(rawChains) {
        if (!rawChains || Object.keys(rawChains).length === 0)
            return;
        const chains = Object.entries(rawChains).map(([id, rpcUrl]) => ({ id: Number(id), rpcUrl }));
        this.availableChains = chains;
        this.storeItemToStorage(AVAILABLE_CHAINS_STORAGE_KEY, chains);
        this.switchChain(this._activeChain.id);
    }
    updateWalletCapabilities(capabilities) {
        this._walletCapabilities = capabilities;
        this.storeItemToStorage(WALLET_CAPABILITIES_STORAGE_KEY, capabilities);
    }
    storeItemToStorage(key, item) {
        this.storage.setItem(key, JSON.stringify(item));
    }
    loadItemFromStorage(key) {
        const item = this.storage.getItem(key);
        return item ? JSON.parse(item) : undefined;
    }
    clear() {
        this.storage.clear();
    }
}
exports.SCWStateManager = SCWStateManager;
