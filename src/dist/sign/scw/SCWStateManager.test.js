"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SCWStateManager_1 = require("./SCWStateManager");
describe('SCWStateManager', () => {
    const DEFAULT_CHAIN = {
        id: 1,
        rpcUrl: undefined,
    };
    const AVAILABLE_CHAINS = { 7: 'https://chain7.com', 13: 'https://chain13.com' };
    let stateManager;
    beforeEach(() => {
        stateManager = new SCWStateManager_1.SCWStateManager({
            appChainIds: [DEFAULT_CHAIN.id],
            updateListener: {
                onAccountsUpdate: jest.fn(),
                onChainUpdate: jest.fn(),
            },
        });
    });
    afterEach(() => {
        stateManager.clear();
    });
    describe('fallback to appChainIds[0]', () => {
        const appChainIds = [10];
        let stateManager;
        beforeEach(() => {
            stateManager = new SCWStateManager_1.SCWStateManager({
                appChainIds,
                updateListener: {
                    onAccountsUpdate: jest.fn(),
                    onChainUpdate: jest.fn(),
                },
            });
        });
        it('should use the first chain id from appChainIds as the active chain', () => {
            expect(stateManager.activeChain.id).toBe(appChainIds[0]);
        });
        it('should use the first chain id from appChainIds as the active chain when appChainIds is empty', () => {
            stateManager = new SCWStateManager_1.SCWStateManager({
                appChainIds: [],
                updateListener: {
                    onAccountsUpdate: jest.fn(),
                    onChainUpdate: jest.fn(),
                },
            });
            expect(stateManager.activeChain.id).toBe(1);
        });
    });
    describe('switchChain', () => {
        beforeEach(() => {
            stateManager.updateAvailableChains(AVAILABLE_CHAINS);
        });
        it('should switch the active chain when the chain is available', () => {
            const switched = stateManager.switchChain(7);
            expect(switched).toBe(true);
            expect(stateManager.activeChain.id).toBe(7);
        });
        it('should not switch the active chain when the chain is not available', () => {
            const switched = stateManager.switchChain(3);
            expect(switched).toBe(false);
            expect(stateManager.activeChain.id).toBe(DEFAULT_CHAIN.id);
        });
        it('should not update the active chain when switching to the same chain', () => {
            const switched = stateManager.switchChain(DEFAULT_CHAIN.id);
            expect(switched).toBe(false);
            expect(stateManager.activeChain.id).toBe(DEFAULT_CHAIN.id);
        });
    });
    describe('updateAvailableChains', () => {
        it('should update the active chain when the rpc url of the active chain is updated', () => {
            expect(stateManager.activeChain.rpcUrl).toBeUndefined();
            stateManager.updateAvailableChains({ 1: 'https://chain1.com' });
            expect(stateManager.activeChain.rpcUrl).toBe('https://chain1.com');
        });
        it('should not update the active chain when available chains does not include the active chain', () => {
            stateManager.updateAvailableChains({ 3: 'https://chain3.com' });
            expect(stateManager.activeChain.id).toBe(DEFAULT_CHAIN.id);
        });
    });
    describe('chainUpdatedListener', () => {
        const chainUpdatedListener = jest.fn();
        beforeEach(() => {
            stateManager = new SCWStateManager_1.SCWStateManager({
                appChainIds: [1],
                updateListener: {
                    onAccountsUpdate: jest.fn(),
                    onChainUpdate: chainUpdatedListener,
                },
            });
            stateManager.updateAvailableChains(AVAILABLE_CHAINS);
        });
        describe('switchChain', () => {
            it('should call chainUpdatedListener when switching the active chain', () => {
                stateManager.switchChain(7);
                expect(chainUpdatedListener).toHaveBeenCalledWith({
                    id: 7,
                    rpcUrl: 'https://chain7.com',
                });
            });
            it('should not call chainUpdatedListener when switching to an unavailable chain', () => {
                stateManager.switchChain(3);
                expect(chainUpdatedListener).not.toHaveBeenCalled();
            });
        });
        describe('updateAvailableChains', () => {
            it('should call chainUpdatedListener when updated available chains include the active chain', () => {
                stateManager.updateAvailableChains({ 1: 'https://chain1.com' });
                expect(chainUpdatedListener).toHaveBeenCalledWith({
                    id: 1,
                    rpcUrl: 'https://chain1.com',
                });
            });
            it('should not call chainUpdatedListener when updated available chains does not include the active chain', () => {
                stateManager.updateAvailableChains({ 3: 'https://chain3.com' });
                expect(chainUpdatedListener).not.toHaveBeenCalled();
            });
        });
    });
});
//# sourceMappingURL=SCWStateManager.test.js.map