"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WLSigner = void 0;
const WLRelayAdapter_1 = require("./relay/WLRelayAdapter");
const constants_1 = require("../../core/constants");
const message_1 = require("../../core/message");
class WLSigner {
    constructor(params) {
        const { appName, appLogoUrl } = params.metadata;
        this.popupCommunicator = params.popupCommunicator;
        this.adapter = new WLRelayAdapter_1.WLRelayAdapter({
            appName,
            appLogoUrl,
            walletlinkUrl: constants_1.WALLETLINK_URL,
            updateListener: params.updateListener,
        });
    }
    async handshake() {
        const ethAddresses = await this.request({ method: 'eth_requestAccounts' });
        return ethAddresses;
    }
    async request(requestArgs) {
        return this.adapter.request(requestArgs);
    }
    async handleWalletLinkSessionRequest() {
        this.postWalletLinkSession();
        // Wait for the wallet link session to be established
        await this.handshake();
        this.postWalletLinkConnected();
    }
    postWalletLinkSession() {
        const { id, secret } = this.adapter.getWalletLinkSession();
        this.postWalletLinkUpdate({ session: { id, secret } });
    }
    postWalletLinkConnected() {
        this.postWalletLinkUpdate({ connected: true });
    }
    postWalletLinkUpdate(data) {
        this.popupCommunicator.postMessage((0, message_1.createMessage)({
            event: message_1.ConfigEvent.WalletLinkUpdate,
            data,
        }));
    }
    async disconnect() {
        await this.adapter.close();
    }
}
exports.WLSigner = WLSigner;
//# sourceMappingURL=WLSigner.js.map