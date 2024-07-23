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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignHandler = void 0;
const SCWSigner_1 = require("./scw/SCWSigner");
const WLSigner_1 = require("./walletlink/WLSigner");
const PopUpCommunicator_1 = require("../core/communicator/PopUpCommunicator");
const constants_1 = require("../core/constants");
const message_1 = require("../core/message");
const ScopedLocalStorage_1 = require("../util/ScopedLocalStorage");
const SIGNER_TYPE_KEY = 'SignerType';
class SignHandler {
    constructor(params) {
        this.storage = new ScopedLocalStorage_1.ScopedLocalStorage('CBWSDK', 'SignerConfigurator');
        this.metadata = params.metadata;
        this.listener = params.listener;
        const _a = params.preference, { keysUrl } = _a, preferenceWithoutKeysUrl = __rest(_a, ["keysUrl"]);
        this.preference = preferenceWithoutKeysUrl;
        this.popupCommunicator = new PopUpCommunicator_1.PopUpCommunicator({
            url: keysUrl !== null && keysUrl !== void 0 ? keysUrl : constants_1.CB_KEYS_URL,
            onConfigUpdateMessage: this.handleIncomingMessage.bind(this),
        });
        this.signer = this.loadSigner();
    }
    async handshake() {
        const signerType = await this.requestSignerSelection();
        const signer = this.initSigner(signerType);
        const accounts = await signer.handshake();
        this.storage.setItem(SIGNER_TYPE_KEY, signerType);
        this.signer = signer;
        return accounts;
    }
    async request(request) {
        if (!this.signer) {
            throw new Error('Signer is not initialized');
        }
        return this.signer.request(request);
    }
    disconnect() {
        var _a;
        (_a = this.signer) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.signer = null;
        this.storage.removeItem(SIGNER_TYPE_KEY);
    }
    loadSigner() {
        const signerType = this.storage.getItem(SIGNER_TYPE_KEY);
        return signerType ? this.initSigner(signerType) : null;
    }
    async requestSignerSelection() {
        await this.popupCommunicator.connect();
        const message = (0, message_1.createMessage)({
            event: message_1.ConfigEvent.SelectSignerType,
            data: this.preference,
        });
        const response = await this.popupCommunicator.postMessageForResponse(message);
        return response.data;
    }
    initSigner(signerType) {
        if (signerType === 'walletlink' && this.walletlinkSigner) {
            return this.walletlinkSigner;
        }
        const SignerClasses = {
            scw: SCWSigner_1.SCWSigner,
            walletlink: WLSigner_1.WLSigner,
            extension: undefined,
        };
        return new SignerClasses[signerType]({
            metadata: this.metadata,
            popupCommunicator: this.popupCommunicator,
            updateListener: this.listener,
        });
    }
    async handleIncomingMessage(message) {
        if (!(0, message_1.isConfigUpdateMessage)(message) || //
            message.event !== message_1.ConfigEvent.WalletLinkSessionRequest) {
            return false;
        }
        if (!this.walletlinkSigner) {
            this.walletlinkSigner = this.initSigner('walletlink');
        }
        await this.walletlinkSigner.handleWalletLinkSessionRequest();
        return true;
    }
}
exports.SignHandler = SignHandler;
//# sourceMappingURL=SignHandler.js.map