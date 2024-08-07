"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineMethodCategory = determineMethodCategory;
const mapping = {
    handshake: ['eth_requestAccounts'],
    sign: [
        'eth_ecRecover',
        'personal_sign',
        'personal_ecRecover',
        'eth_signTransaction',
        'eth_sendTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'eth_signTypedData',
        'wallet_addEthereumChain',
        'wallet_switchEthereumChain',
        'wallet_watchAsset',
        'wallet_getCapabilities',
        'wallet_sendCalls',
        'wallet_showCallsStatus',
    ],
    state: [
        // internal state
        'eth_chainId',
        'eth_accounts',
        'eth_coinbase',
        'net_version',
    ],
    deprecated: ['eth_sign', 'eth_signTypedData_v2'],
    unsupported: ['eth_subscribe', 'eth_unsubscribe'],
    fetch: [],
};
function determineMethodCategory(method) {
    for (const c in mapping) {
        const category = c;
        if (mapping[category].includes(method)) {
            return category;
        }
    }
    return undefined;
}
