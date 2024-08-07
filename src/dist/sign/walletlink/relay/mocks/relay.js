"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockedWalletLinkRelay = mockedWalletLinkRelay;
const fixtures_1 = require("./fixtures");
const type_1 = require("../../../../core/type");
function mockedWalletLinkRelay() {
    return mock;
}
function makeMockReturn(response) {
    return Promise.resolve(response);
}
const mock = {
    resetAndReload() { },
    requestEthereumAccounts() {
        return makeMockReturn({
            method: 'requestEthereumAccounts',
            result: [(0, type_1.AddressString)(fixtures_1.MOCK_ADDERESS)],
        });
    },
    addEthereumChain() {
        return makeMockReturn({
            method: 'addEthereumChain',
            result: {
                isApproved: true,
                rpcUrl: 'https://node.ethchain.com',
            },
        });
    },
    watchAsset() {
        return makeMockReturn({
            method: 'watchAsset',
            result: true,
        });
    },
    switchEthereumChain() {
        return makeMockReturn({
            method: 'switchEthereumChain',
            result: {
                isApproved: true,
                rpcUrl: 'https://node.ethchain.com',
            },
        });
    },
    signEthereumMessage() {
        return makeMockReturn({
            method: 'signEthereumMessage',
            result: (0, type_1.HexString)('0x'),
        });
    },
    ethereumAddressFromSignedMessage() {
        return makeMockReturn({
            method: 'ethereumAddressFromSignedMessage',
            result: (0, type_1.AddressString)(fixtures_1.MOCK_ADDERESS),
        });
    },
    signEthereumTransaction() {
        return makeMockReturn({
            method: 'signEthereumTransaction',
            result: (0, type_1.HexString)(fixtures_1.MOCK_TX),
        });
    },
    signAndSubmitEthereumTransaction() {
        return makeMockReturn({
            method: 'submitEthereumTransaction',
            result: (0, type_1.HexString)(fixtures_1.MOCK_TX),
        });
    },
    submitEthereumTransaction() {
        return makeMockReturn({
            method: 'submitEthereumTransaction',
            result: (0, type_1.HexString)(fixtures_1.MOCK_TX),
        });
    },
    scanQRCode() {
        return makeMockReturn({
            method: 'scanQRCode',
            result: 'Success',
        });
    },
    genericRequest() {
        return makeMockReturn({
            method: 'generic',
            result: 'Success',
        });
    },
    sendRequest() {
        return Promise.reject();
    },
    setAppInfo() {
        return;
    },
    setAccountsCallback() {
        return;
    },
    setChainCallback() {
        return;
    },
    setDappDefaultChainCallback() {
        return;
    },
    attachUI() {
        return;
    },
};
