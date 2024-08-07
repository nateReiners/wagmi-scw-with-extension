import EventEmitter from 'eventemitter3';
import { ConstructorOptions, ProviderInterface, RequestArguments } from './core/provider/interface';
import { AddressString, Chain } from './core/type';
export declare class CoinbaseWalletProvider extends EventEmitter implements ProviderInterface {
    private readonly metadata;
    private readonly preference;
    private readonly communicator;
    private signer;
    protected accounts: AddressString[];
    protected chain: Chain;
    constructor({ metadata, preference: { keysUrl, ...preference } }: Readonly<ConstructorOptions>);
    get connected(): boolean;
    request<T>(args: RequestArguments): Promise<T>;
    protected readonly handlers: {
        handshake: (_: RequestArguments) => Promise<AddressString[]>;
        sign: (request: RequestArguments) => Promise<unknown>;
        fetch: (request: RequestArguments) => Promise<any>;
        state: (request: RequestArguments) => number | import("./core/type").HexString | AddressString | AddressString[];
        deprecated: ({ method }: RequestArguments) => never;
        unsupported: ({ method }: RequestArguments) => never;
    };
    private handleUnauthorizedError;
    /** @deprecated Use `.request({ method: 'eth_requestAccounts' })` instead. */
    enable(): Promise<unknown>;
    disconnect(): Promise<void>;
    readonly isCoinbaseWallet = true;
    protected readonly updateListener: {
        onAccountsUpdate: (accounts: AddressString[]) => void;
        onChainUpdate: (chain: Chain) => void;
    };
    private requestSignerSelection;
    private initSigner;
}
