"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLRelayAdapter = void 0;
// Copyright (c) 2018-2024 Coinbase, Inc. <https://www.coinbase.com/>
const eth_eip712_util_1 = __importDefault(require("../../../vendor-js/eth-eip712-util"));
const constants_1 = require("./constants");
const RelayEventManager_1 = require("./RelayEventManager");
const Web3Response_1 = require("./type/Web3Response");
const WalletLinkRelay_1 = require("./WalletLinkRelay");
const error_1 = require("../../../core/error");
const util_1 = require("../../../core/type/util");
const ScopedLocalStorage_1 = require("../../../util/ScopedLocalStorage");
const DEFAULT_CHAIN_ID_KEY = 'DefaultChainId';
const DEFAULT_JSON_RPC_URL = 'DefaultJsonRpcUrl';
class WLRelayAdapter {
    constructor(options) {
        this._relay = null;
        this._addresses = [];
        this.hasMadeFirstChainChangedEmission = false;
        this._appName = options.appName;
        this._appLogoUrl = options.appLogoUrl;
        this._walletlinkUrl = options.walletlinkUrl;
        this._storage = new ScopedLocalStorage_1.ScopedLocalStorage('walletlink', this._walletlinkUrl);
        this.updateListener = options.updateListener;
        this._relayEventManager = new RelayEventManager_1.RelayEventManager();
        this._jsonRpcUrlFromOpts = '';
        const cachedAddresses = this._storage.getItem(constants_1.LOCAL_STORAGE_ADDRESSES_KEY);
        if (cachedAddresses) {
            const addresses = cachedAddresses.split(' ');
            if (addresses[0] !== '') {
                this._addresses = addresses.map((address) => (0, util_1.ensureAddressString)(address));
                this.updateListener.onAccountsUpdate({
                    accounts: this._addresses,
                    source: 'storage',
                });
            }
        }
        const cachedChainId = this._storage.getItem(DEFAULT_CHAIN_ID_KEY);
        if (cachedChainId) {
            this.updateListener.onChainUpdate({
                chain: {
                    id: this.getChainId(),
                    rpcUrl: this.jsonRpcUrl,
                },
                source: 'storage',
            });
            this.hasMadeFirstChainChangedEmission = true;
        }
    }
    getWalletLinkSession() {
        const relay = this.initializeRelay();
        return relay.getWalletLinkSession();
    }
    get selectedAddress() {
        return this._addresses[0] || undefined;
    }
    get jsonRpcUrl() {
        var _a;
        return (_a = this._storage.getItem(DEFAULT_JSON_RPC_URL)) !== null && _a !== void 0 ? _a : this._jsonRpcUrlFromOpts;
    }
    set jsonRpcUrl(value) {
        this._storage.setItem(DEFAULT_JSON_RPC_URL, value);
    }
    updateProviderInfo(jsonRpcUrl, chainId) {
        this.jsonRpcUrl = jsonRpcUrl;
        // emit chainChanged event if necessary
        const originalChainId = this.getChainId();
        this._storage.setItem(DEFAULT_CHAIN_ID_KEY, chainId.toString(10));
        const chainChanged = (0, util_1.ensureIntNumber)(chainId) !== originalChainId;
        if (chainChanged || !this.hasMadeFirstChainChangedEmission) {
            this.updateListener.onChainUpdate({
                chain: { id: chainId, rpcUrl: jsonRpcUrl },
                source: 'wallet',
            });
            this.hasMadeFirstChainChangedEmission = true;
        }
    }
    async watchAsset(type, address, symbol, decimals, image, chainId) {
        const relay = this.initializeRelay();
        const result = await relay.watchAsset(type, address, symbol, decimals, image, chainId === null || chainId === void 0 ? void 0 : chainId.toString());
        if ((0, Web3Response_1.isErrorResponse)(result))
            return false;
        return !!result.result;
    }
    async addEthereumChain(chainId, rpcUrls, blockExplorerUrls, chainName, iconUrls, nativeCurrency) {
        var _a, _b;
        if ((0, util_1.ensureIntNumber)(chainId) === this.getChainId()) {
            return false;
        }
        const relay = this.initializeRelay();
        if (!this._isAuthorized()) {
            await relay.requestEthereumAccounts();
        }
        const res = await relay.addEthereumChain(chainId.toString(), rpcUrls, iconUrls, blockExplorerUrls, chainName, nativeCurrency);
        if ((0, Web3Response_1.isErrorResponse)(res))
            return false;
        if (((_a = res.result) === null || _a === void 0 ? void 0 : _a.isApproved) === true) {
            this.updateProviderInfo(rpcUrls[0], chainId);
        }
        return ((_b = res.result) === null || _b === void 0 ? void 0 : _b.isApproved) === true;
    }
    async switchEthereumChain(chainId) {
        const relay = this.initializeRelay();
        const res = await relay.switchEthereumChain(chainId.toString(10), this.selectedAddress || undefined);
        // backward compatibility
        if ((0, Web3Response_1.isErrorResponse)(res)) {
            if (!res.errorCode)
                return;
            if (res.errorCode === error_1.standardErrorCodes.provider.unsupportedChain) {
                throw error_1.standardErrors.provider.unsupportedChain();
            }
            else {
                throw error_1.standardErrors.provider.custom({
                    message: res.errorMessage,
                    code: res.errorCode,
                });
            }
        }
        const switchResponse = res.result;
        if (switchResponse.isApproved && switchResponse.rpcUrl.length > 0) {
            this.updateProviderInfo(switchResponse.rpcUrl, chainId);
        }
    }
    async close() {
        const relay = this.initializeRelay();
        relay.resetAndReload();
        this._storage.clear();
    }
    async request(args) {
        try {
            return this._request(args).catch((error) => {
                throw error;
            });
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async _request(args) {
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
            throw error_1.standardErrors.rpc.invalidRequest({
                message: 'Expected a single, non-array, object argument.',
                data: args,
            });
        }
        const { method, params } = args;
        if (typeof method !== 'string' || method.length === 0) {
            throw error_1.standardErrors.rpc.invalidRequest({
                message: "'args.method' must be a non-empty string.",
                data: args,
            });
        }
        if (params !== undefined &&
            !Array.isArray(params) &&
            (typeof params !== 'object' || params === null)) {
            throw error_1.standardErrors.rpc.invalidRequest({
                message: "'args.params' must be an object or array if provided.",
                data: args,
            });
        }
        const newParams = params === undefined ? [] : params;
        // Coinbase Wallet Requests
        const id = this._relayEventManager.makeRequestId();
        const result = await this._sendRequestAsync({
            method,
            params: newParams,
            jsonrpc: '2.0',
            id,
        });
        return result.result;
    }
    _setAddresses(addresses, _) {
        if (!Array.isArray(addresses)) {
            throw new Error('addresses is not an array');
        }
        const newAddresses = addresses.map((address) => (0, util_1.ensureAddressString)(address));
        if (JSON.stringify(newAddresses) === JSON.stringify(this._addresses)) {
            return;
        }
        this._addresses = newAddresses;
        this.updateListener.onAccountsUpdate({
            accounts: newAddresses,
            source: 'wallet',
        });
        this._storage.setItem(constants_1.LOCAL_STORAGE_ADDRESSES_KEY, newAddresses.join(' '));
    }
    _sendRequestAsync(request) {
        return new Promise((resolve, reject) => {
            try {
                const syncResult = this._handleSynchronousMethods(request);
                if (syncResult !== undefined) {
                    return resolve({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: syncResult,
                    });
                }
            }
            catch (err) {
                return reject(err);
            }
            this._handleAsynchronousMethods(request)
                .then((res) => res && resolve(Object.assign(Object.assign({}, res), { id: request.id })))
                .catch((err) => reject(err));
        });
    }
    _handleSynchronousMethods(request) {
        const { method } = request;
        switch (method) {
            case 'eth_accounts':
                return this._eth_accounts();
            case 'eth_coinbase':
                return this._eth_coinbase();
            case 'net_version':
                return this._net_version();
            case 'eth_chainId':
                return this._eth_chainId();
            default:
                return undefined;
        }
    }
    async _handleAsynchronousMethods(request) {
        const { method } = request;
        const params = request.params || [];
        switch (method) {
            case 'eth_requestAccounts':
                return this._eth_requestAccounts();
            case 'eth_sign':
                return this._eth_sign(params);
            case 'eth_ecRecover':
                return this._eth_ecRecover(params);
            case 'personal_sign':
                return this._personal_sign(params);
            case 'personal_ecRecover':
                return this._personal_ecRecover(params);
            case 'eth_signTransaction':
                return this._eth_signTransaction(params);
            case 'eth_sendRawTransaction':
                return this._eth_sendRawTransaction(params);
            case 'eth_sendTransaction':
                return this._eth_sendTransaction(params);
            case 'eth_signTypedData_v1':
                return this._eth_signTypedData_v1(params);
            case 'eth_signTypedData_v2':
                return this._throwUnsupportedMethodError();
            case 'eth_signTypedData_v3':
                return this._eth_signTypedData_v3(params);
            case 'eth_signTypedData_v4':
            case 'eth_signTypedData':
                return this._eth_signTypedData_v4(params);
            case 'wallet_addEthereumChain':
                return this._wallet_addEthereumChain(params);
            case 'wallet_switchEthereumChain':
                return this._wallet_switchEthereumChain(params);
            case 'wallet_watchAsset':
                return this._wallet_watchAsset(params);
            default:
                return this._throwUnsupportedMethodError();
        }
    }
    _isKnownAddress(addressString) {
        try {
            const addressStr = (0, util_1.ensureAddressString)(addressString);
            const lowercaseAddresses = this._addresses.map((address) => (0, util_1.ensureAddressString)(address));
            return lowercaseAddresses.includes(addressStr);
        }
        catch (_a) {
            // noop
        }
        return false;
    }
    _ensureKnownAddress(addressString) {
        if (!this._isKnownAddress(addressString)) {
            throw new Error('Unknown Ethereum address');
        }
    }
    _prepareTransactionParams(tx) {
        const fromAddress = tx.from ? (0, util_1.ensureAddressString)(tx.from) : this.selectedAddress;
        if (!fromAddress) {
            throw new Error('Ethereum address is unavailable');
        }
        this._ensureKnownAddress(fromAddress);
        const toAddress = tx.to ? (0, util_1.ensureAddressString)(tx.to) : null;
        const weiValue = tx.value != null ? (0, util_1.ensureBigInt)(tx.value) : BigInt(0);
        const data = tx.data ? (0, util_1.ensureBuffer)(tx.data) : Buffer.alloc(0);
        const nonce = tx.nonce != null ? (0, util_1.ensureIntNumber)(tx.nonce) : null;
        const gasPriceInWei = tx.gasPrice != null ? (0, util_1.ensureBigInt)(tx.gasPrice) : null;
        const maxFeePerGas = tx.maxFeePerGas != null ? (0, util_1.ensureBigInt)(tx.maxFeePerGas) : null;
        const maxPriorityFeePerGas = tx.maxPriorityFeePerGas != null ? (0, util_1.ensureBigInt)(tx.maxPriorityFeePerGas) : null;
        const gasLimit = tx.gas != null ? (0, util_1.ensureBigInt)(tx.gas) : null;
        const chainId = tx.chainId ? (0, util_1.ensureIntNumber)(tx.chainId) : this.getChainId();
        return {
            fromAddress,
            toAddress,
            weiValue,
            data,
            nonce,
            gasPriceInWei,
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit,
            chainId,
        };
    }
    _isAuthorized() {
        return this._addresses.length > 0;
    }
    _requireAuthorization() {
        if (!this._isAuthorized()) {
            throw error_1.standardErrors.provider.unauthorized({});
        }
    }
    _throwUnsupportedMethodError() {
        throw error_1.standardErrors.provider.unsupportedMethod({});
    }
    async _signEthereumMessage(message, address, addPrefix, typedDataJson) {
        this._ensureKnownAddress(address);
        try {
            const relay = this.initializeRelay();
            const res = await relay.signEthereumMessage(message, address, addPrefix, typedDataJson);
            if ((0, Web3Response_1.isErrorResponse)(res)) {
                throw new Error(res.errorMessage);
            }
            return { jsonrpc: '2.0', id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === 'string' && err.message.match(/(denied|rejected)/i)) {
                throw error_1.standardErrors.provider.userRejectedRequest('User denied message signature');
            }
            throw err;
        }
    }
    async _ethereumAddressFromSignedMessage(message, signature, addPrefix) {
        const relay = this.initializeRelay();
        const res = await relay.ethereumAddressFromSignedMessage(message, signature, addPrefix);
        if ((0, Web3Response_1.isErrorResponse)(res)) {
            throw new Error(res.errorMessage);
        }
        return { jsonrpc: '2.0', id: 0, result: res.result };
    }
    _eth_accounts() {
        return [...this._addresses];
    }
    _eth_coinbase() {
        return this.selectedAddress || null;
    }
    _net_version() {
        return this.getChainId().toString(10);
    }
    _eth_chainId() {
        return (0, util_1.hexStringFromIntNumber)(this.getChainId());
    }
    getChainId() {
        const chainIdStr = this._storage.getItem(DEFAULT_CHAIN_ID_KEY);
        if (!chainIdStr) {
            return (0, util_1.ensureIntNumber)(1); // default to mainnet
        }
        const chainId = parseInt(chainIdStr, 10);
        return (0, util_1.ensureIntNumber)(chainId);
    }
    async _eth_requestAccounts() {
        if (this._isAuthorized()) {
            return Promise.resolve({
                jsonrpc: '2.0',
                id: 0,
                result: this._addresses,
            });
        }
        let res;
        try {
            const relay = this.initializeRelay();
            res = await relay.requestEthereumAccounts();
            if ((0, Web3Response_1.isErrorResponse)(res)) {
                throw new Error(res.errorMessage);
            }
        }
        catch (err) {
            if (typeof err.message === 'string' && err.message.match(/(denied|rejected)/i)) {
                throw error_1.standardErrors.provider.userRejectedRequest('User denied account authorization');
            }
            throw err;
        }
        if (!res.result) {
            throw new Error('accounts received is empty');
        }
        this._setAddresses(res.result);
        return { jsonrpc: '2.0', id: 0, result: this._addresses };
    }
    _eth_sign(params) {
        this._requireAuthorization();
        const address = (0, util_1.ensureAddressString)(params[0]);
        const message = (0, util_1.ensureBuffer)(params[1]);
        return this._signEthereumMessage(message, address, false);
    }
    _eth_ecRecover(params) {
        const message = (0, util_1.ensureBuffer)(params[0]);
        const signature = (0, util_1.ensureBuffer)(params[1]);
        return this._ethereumAddressFromSignedMessage(message, signature, false);
    }
    _personal_sign(params) {
        this._requireAuthorization();
        const message = (0, util_1.ensureBuffer)(params[0]);
        const address = (0, util_1.ensureAddressString)(params[1]);
        return this._signEthereumMessage(message, address, true);
    }
    _personal_ecRecover(params) {
        const message = (0, util_1.ensureBuffer)(params[0]);
        const signature = (0, util_1.ensureBuffer)(params[1]);
        return this._ethereumAddressFromSignedMessage(message, signature, true);
    }
    async _eth_signTransaction(params) {
        this._requireAuthorization();
        const tx = this._prepareTransactionParams(params[0] || {});
        try {
            const relay = this.initializeRelay();
            const res = await relay.signEthereumTransaction(tx);
            if ((0, Web3Response_1.isErrorResponse)(res)) {
                throw new Error(res.errorMessage);
            }
            return { jsonrpc: '2.0', id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === 'string' && err.message.match(/(denied|rejected)/i)) {
                throw error_1.standardErrors.provider.userRejectedRequest('User denied transaction signature');
            }
            throw err;
        }
    }
    async _eth_sendRawTransaction(params) {
        const signedTransaction = (0, util_1.ensureBuffer)(params[0]);
        const relay = this.initializeRelay();
        const res = await relay.submitEthereumTransaction(signedTransaction, this.getChainId());
        if ((0, Web3Response_1.isErrorResponse)(res)) {
            throw new Error(res.errorMessage);
        }
        return { jsonrpc: '2.0', id: 0, result: res.result };
    }
    async _eth_sendTransaction(params) {
        this._requireAuthorization();
        const tx = this._prepareTransactionParams(params[0] || {});
        try {
            const relay = this.initializeRelay();
            const res = await relay.signAndSubmitEthereumTransaction(tx);
            if ((0, Web3Response_1.isErrorResponse)(res)) {
                throw new Error(res.errorMessage);
            }
            return { jsonrpc: '2.0', id: 0, result: res.result };
        }
        catch (err) {
            if (typeof err.message === 'string' && err.message.match(/(denied|rejected)/i)) {
                throw error_1.standardErrors.provider.userRejectedRequest('User denied transaction signature');
            }
            throw err;
        }
    }
    async _eth_signTypedData_v1(params) {
        this._requireAuthorization();
        const typedData = (0, util_1.ensureParsedJSONObject)(params[0]);
        const address = (0, util_1.ensureAddressString)(params[1]);
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedDataLegacy({ data: typedData });
        const typedDataJSON = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJSON);
    }
    async _eth_signTypedData_v3(params) {
        this._requireAuthorization();
        const address = (0, util_1.ensureAddressString)(params[0]);
        const typedData = (0, util_1.ensureParsedJSONObject)(params[1]);
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedData_v3({ data: typedData });
        const typedDataJSON = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJSON);
    }
    async _eth_signTypedData_v4(params) {
        this._requireAuthorization();
        const address = (0, util_1.ensureAddressString)(params[0]);
        const typedData = (0, util_1.ensureParsedJSONObject)(params[1]);
        this._ensureKnownAddress(address);
        const message = eth_eip712_util_1.default.hashForSignTypedData_v4({ data: typedData });
        const typedDataJSON = JSON.stringify(typedData, null, 2);
        return this._signEthereumMessage(message, address, false, typedDataJSON);
    }
    async _wallet_addEthereumChain(params) {
        var _a, _b, _c, _d;
        const request = params[0];
        if (((_a = request.rpcUrls) === null || _a === void 0 ? void 0 : _a.length) === 0) {
            return {
                jsonrpc: '2.0',
                id: 0,
                error: { code: 2, message: `please pass in at least 1 rpcUrl` },
            };
        }
        if (!request.chainName || request.chainName.trim() === '') {
            throw error_1.standardErrors.rpc.invalidParams('chainName is a required field');
        }
        if (!request.nativeCurrency) {
            throw error_1.standardErrors.rpc.invalidParams('nativeCurrency is a required field');
        }
        const chainIdNumber = parseInt(request.chainId, 16);
        const success = await this.addEthereumChain(chainIdNumber, (_b = request.rpcUrls) !== null && _b !== void 0 ? _b : [], (_c = request.blockExplorerUrls) !== null && _c !== void 0 ? _c : [], request.chainName, (_d = request.iconUrls) !== null && _d !== void 0 ? _d : [], request.nativeCurrency);
        if (success) {
            return { jsonrpc: '2.0', id: 0, result: null };
        }
        return {
            jsonrpc: '2.0',
            id: 0,
            error: { code: 2, message: `unable to add ethereum chain` },
        };
    }
    async _wallet_switchEthereumChain(params) {
        const request = params[0];
        await this.switchEthereumChain(parseInt(request.chainId, 16));
        return { jsonrpc: '2.0', id: 0, result: null };
    }
    async _wallet_watchAsset(params) {
        const request = (Array.isArray(params) ? params[0] : params);
        if (!request.type) {
            throw error_1.standardErrors.rpc.invalidParams('Type is required');
        }
        if ((request === null || request === void 0 ? void 0 : request.type) !== 'ERC20') {
            throw error_1.standardErrors.rpc.invalidParams(`Asset of type '${request.type}' is not supported`);
        }
        if (!(request === null || request === void 0 ? void 0 : request.options)) {
            throw error_1.standardErrors.rpc.invalidParams('Options are required');
        }
        if (!(request === null || request === void 0 ? void 0 : request.options.address)) {
            throw error_1.standardErrors.rpc.invalidParams('Address is required');
        }
        const chainId = this.getChainId();
        const { address, symbol, image, decimals } = request.options;
        const res = await this.watchAsset(request.type, address, symbol, decimals, image, chainId);
        return { jsonrpc: '2.0', id: 0, result: res };
    }
    initializeRelay() {
        if (!this._relay) {
            const relay = new WalletLinkRelay_1.WalletLinkRelay({
                linkAPIUrl: this._walletlinkUrl,
                storage: this._storage,
            });
            relay.setAppInfo(this._appName, this._appLogoUrl);
            relay.attachUI();
            relay.setAccountsCallback((accounts, isDisconnect) => this._setAddresses(accounts, isDisconnect));
            relay.setChainCallback((chainId, jsonRpcUrl) => {
                this.updateProviderInfo(jsonRpcUrl, parseInt(chainId, 10));
            });
            this._relay = relay;
        }
        return this._relay;
    }
}
exports.WLRelayAdapter = WLRelayAdapter;
//# sourceMappingURL=WLRelayAdapter.js.map