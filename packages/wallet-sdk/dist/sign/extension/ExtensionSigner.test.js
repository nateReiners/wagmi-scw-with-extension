"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtensionSigner_1 = require("./ExtensionSigner");
const window = globalThis;
const mockUpdateListener = {
    onChainIdUpdate: jest.fn(),
    onAccountsUpdate: jest.fn(),
};
const mockExtensionProvider = {
    setAppInfo: jest.fn(),
    on: jest.fn(),
    request: jest.fn(),
    disconnect: jest.fn(),
};
const eventListeners = {};
mockExtensionProvider.on = jest.fn((event, listener) => {
    eventListeners[event] = listener;
});
window.coinbaseWalletExtension = mockExtensionProvider;
const metadata = {
    appName: 'TestApp',
    appLogoUrl: 'https://test.app/logo.png',
    appChainIds: [1, 4],
};
describe('ExtensionSigner', () => {
    let signer;
    beforeEach(() => {
        signer = new ExtensionSigner_1.ExtensionSigner({ metadata, updateListener: mockUpdateListener });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should set app info on initialization', () => {
        expect(mockExtensionProvider.setAppInfo).toHaveBeenCalledWith('TestApp', 'https://test.app/logo.png', [1, 4]);
    });
    it('should throw error only if Coinbase Wallet extension is not found', () => {
        delete window.coinbaseWalletExtension;
        expect(() => new ExtensionSigner_1.ExtensionSigner({ metadata, updateListener: mockUpdateListener })).toThrow('Coinbase Wallet extension not found');
        window.coinbaseWalletExtension = mockExtensionProvider;
        expect(() => new ExtensionSigner_1.ExtensionSigner({ metadata, updateListener: mockUpdateListener })).not.toThrow();
    });
    it('should handle chainChanged events', () => {
        eventListeners['chainChanged']('1');
        expect(mockUpdateListener.onChainIdUpdate).toHaveBeenCalledWith(1);
    });
    it('should handle accountsChanged events', () => {
        eventListeners['accountsChanged'](['0x123']);
        expect(mockUpdateListener.onAccountsUpdate).toHaveBeenCalledWith(['0x123']);
    });
    it('should request accounts during handshake', async () => {
        // expecting extension provider to return accounts and emit an accountsChanged event
        mockExtensionProvider.request.mockImplementation((args) => args.method === 'eth_requestAccounts' ? ['0x123'] : null);
        eventListeners['accountsChanged'](['0x123']);
        await expect(signer.handshake()).resolves.not.toThrow();
        expect(mockUpdateListener.onAccountsUpdate).toHaveBeenCalledWith(['0x123']);
    });
    it('should not call updateListener if extension request throws', async () => {
        mockExtensionProvider.request.mockImplementation(() => {
            throw new Error('ext provider request error');
        });
        await expect(signer.handshake()).rejects.toThrow('ext provider request error');
        expect(mockUpdateListener.onAccountsUpdate).not.toHaveBeenCalled();
    });
    it('should get results from extension provider', async () => {
        const requestArgs = { method: 'someReq' };
        mockExtensionProvider.request.mockResolvedValueOnce('resFromExt');
        const response = await signer.request(requestArgs);
        expect(response).toBe('resFromExt');
        expect(mockExtensionProvider.request).toHaveBeenCalledWith(requestArgs);
    });
    it('should disconnect from extension provider', async () => {
        await signer.disconnect();
        expect(mockExtensionProvider.disconnect).toHaveBeenCalled();
    });
});
//# sourceMappingURL=ExtensionSigner.test.js.map