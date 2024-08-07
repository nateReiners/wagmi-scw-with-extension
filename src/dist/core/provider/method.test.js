"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const method_1 = require("./method");
describe('determineMethodCategory', () => {
    test('should return "handshake" for handshake method', () => {
        expect((0, method_1.determineMethodCategory)('eth_requestAccounts')).toBe('handshake');
    });
    test('should return "sign" for signing methods', () => {
        const methods = ['eth_signTransaction', 'wallet_switchEthereumChain'];
        methods.forEach((method) => {
            expect((0, method_1.determineMethodCategory)(method)).toBe('sign');
        });
    });
    test('should return "state" for state query methods', () => {
        const methods = ['eth_chainId', 'eth_accounts'];
        methods.forEach((method) => {
            expect((0, method_1.determineMethodCategory)(method)).toBe('state');
        });
    });
    test('should return undefined for filter methods', () => {
        const methods = ['eth_newFilter', 'eth_getFilterChanges'];
        methods.forEach((method) => {
            expect((0, method_1.determineMethodCategory)(method)).toBeUndefined();
        });
    });
    test('should return "deprecated" for deprecated methods', () => {
        const methods = ['eth_sign', 'eth_signTypedData_v2'];
        methods.forEach((method) => {
            expect((0, method_1.determineMethodCategory)(method)).toBe('deprecated');
        });
    });
    test('should return "unsupported" for unsupported methods', () => {
        const methods = ['eth_subscribe', 'eth_unsubscribe'];
        methods.forEach((method) => {
            expect((0, method_1.determineMethodCategory)(method)).toBe('unsupported');
        });
    });
    test('should return undefined for unknown methods', () => {
        expect((0, method_1.determineMethodCategory)('unknown_method')).toBeUndefined();
    });
});
//# sourceMappingURL=method.test.js.map