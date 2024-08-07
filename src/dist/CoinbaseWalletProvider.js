"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseWalletProvider = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const error_1 = require("./core/error");
const serialize_1 = require("./core/error/serialize");
const type_1 = require("./core/type");
const util_1 = require("./core/type/util");
const util_2 = require("./sign/util");
const provider_1 = require("./util/provider");
const Communicator_1 = require("./core/communicator/Communicator");
const method_1 = require("./core/provider/method");
const ScopedLocalStorage_1 = require("./util/ScopedLocalStorage");
class CoinbaseWalletProvider extends eventemitter3_1.default {
    constructor(_a) {
        var _b, _c;
        var { metadata } = _a, _d = _a.preference, { keysUrl } = _d, preference = __rest(_d, ["keysUrl"]);
        super();
        this.accounts = [];
        this.handlers = {
            // eth_requestAccounts
            handshake: async (_) => {
                if (this.connected) {
                    this.emit('connect', { chainId: (0, util_1.hexStringFromIntNumber)((0, type_1.IntNumber)(this.chain.id)) });
                    return this.accounts;
                }
                const signerType = await this.requestSignerSelection();
                const signer = this.initSigner(signerType);
                const accounts = await signer.handshake();
                this.signer = signer;
                (0, util_2.storeSignerType)(signerType);
                this.emit('connect', { chainId: (0, util_1.hexStringFromIntNumber)((0, type_1.IntNumber)(this.chain.id)) });
                return accounts;
            },
            sign: async (request) => {
                if (!this.connected || !this.signer) {
                    throw error_1.standardErrors.provider.unauthorized("Must call 'eth_requestAccounts' before other methods");
                }
                return await this.signer.request(request);
            },
            fetch: (request) => (0, provider_1.fetchRPCRequest)(request, this.chain),
            state: (request) => {
                const getConnectedAccounts = () => {
                    if (this.connected)
                        return this.accounts;
                    throw error_1.standardErrors.provider.unauthorized("Must call 'eth_requestAccounts' before other methods");
                };
                switch (request.method) {
                    case 'eth_chainId':
                        return (0, util_1.hexStringFromIntNumber)((0, type_1.IntNumber)(this.chain.id));
                    case 'net_version':
                        return this.chain.id;
                    case 'eth_accounts':
                        return getConnectedAccounts();
                    case 'eth_coinbase':
                        return getConnectedAccounts()[0];
                    default:
                        return this.handlers.unsupported(request);
                }
            },
            deprecated: ({ method }) => {
                throw error_1.standardErrors.rpc.methodNotSupported(`Method ${method} is deprecated.`);
            },
            unsupported: ({ method }) => {
                throw error_1.standardErrors.rpc.methodNotSupported(`Method ${method} is not supported.`);
            },
        };
        this.isCoinbaseWallet = true;
        this.updateListener = {
            onAccountsUpdate: (accounts) => {
                if ((0, util_1.areAddressArraysEqual)(this.accounts, accounts))
                    return;
                this.accounts = accounts;
                this.emit('accountsChanged', this.accounts);
            },
            onChainUpdate: (chain) => {
                if (chain.id === this.chain.id && chain.rpcUrl === this.chain.rpcUrl)
                    return;
                this.chain = chain;
                this.emit('chainChanged', (0, util_1.hexStringFromIntNumber)((0, type_1.IntNumber)(chain.id)));
            },
        };
        this.metadata = metadata;
        this.preference = preference;
        this.communicator = new Communicator_1.Communicator(keysUrl);
        this.chain = {
            id: (_c = (_b = metadata.appChainIds) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : 1,
        };
        // Load states from storage
        const signerType = (0, util_2.loadSignerType)();
        this.signer = signerType ? this.initSigner(signerType) : null;
    }
    get connected() {
        return this.accounts.length > 0;
    }
    async request(args) {
        var _a;
        try {
            (0, provider_1.checkErrorForInvalidRequestArgs)(args);
            // unrecognized methods are treated as fetch requests
            const category = (_a = (0, method_1.determineMethodCategory)(args.method)) !== null && _a !== void 0 ? _a : 'fetch';
            return this.handlers[category](args);
        }
        catch (error) {
            this.handleUnauthorizedError(error);
            return Promise.reject((0, serialize_1.serializeError)(error, args.method));
        }
    }
    handleUnauthorizedError(error) {
        const e = error;
        if (e.code === error_1.standardErrorCodes.provider.unauthorized)
            this.disconnect();
    }
    /** @deprecated Use `.request({ method: 'eth_requestAccounts' })` instead. */
    async enable() {
        console.warn(`.enable() has been deprecated. Please use .request({ method: "eth_requestAccounts" }) instead.`);
        return await this.request({
            method: 'eth_requestAccounts',
        });
    }
    async disconnect() {
        var _a;
        this.accounts = [];
        this.chain = { id: 1 };
        (_a = this.signer) === null || _a === void 0 ? void 0 : _a.disconnect();
        ScopedLocalStorage_1.ScopedLocalStorage.clearAll();
        this.emit('disconnect', error_1.standardErrors.provider.disconnected('User initiated disconnection'));
    }
    requestSignerSelection() {
        return (0, util_2.fetchSignerType)({
            communicator: this.communicator,
            preference: this.preference,
            metadata: this.metadata,
        });
    }
    initSigner(signerType) {
        return (0, util_2.createSigner)({
            signerType,
            metadata: this.metadata,
            communicator: this.communicator,
            updateListener: this.updateListener,
        });
    }
}
exports.CoinbaseWalletProvider = CoinbaseWalletProvider;
