import { StateUpdateListener } from '../../interface';
import { RequestArguments } from '../../../core/provider/interface';
import { AddressString } from '../../../core/type';
export declare class WLRelayAdapter {
    private _appName;
    private _appLogoUrl;
    private _relay;
    private readonly _walletlinkUrl;
    private readonly _storage;
    private readonly _relayEventManager;
    private _jsonRpcUrlFromOpts;
    private _addresses;
    private hasMadeFirstChainChangedEmission;
    private updateListener;
    constructor(options: {
        appName: string;
        appLogoUrl: string | null;
        walletlinkUrl: string;
        updateListener: StateUpdateListener;
    });
    getWalletLinkSession(): import("./type/WalletLinkSession").WalletLinkSession;
    get selectedAddress(): AddressString | undefined;
    private get jsonRpcUrl();
    private set jsonRpcUrl(value);
    private updateProviderInfo;
    private watchAsset;
    private addEthereumChain;
    private switchEthereumChain;
    close(): Promise<void>;
    request<T>(args: RequestArguments): Promise<T>;
    private _request;
    protected _setAddresses(addresses: string[], _?: boolean): void;
    private _sendRequestAsync;
    private _handleSynchronousMethods;
    private _handleAsynchronousMethods;
    private _isKnownAddress;
    private _ensureKnownAddress;
    private _prepareTransactionParams;
    protected _isAuthorized(): boolean;
    private _requireAuthorization;
    private _throwUnsupportedMethodError;
    private _signEthereumMessage;
    private _ethereumAddressFromSignedMessage;
    private _eth_accounts;
    private _eth_coinbase;
    private _net_version;
    private _eth_chainId;
    private getChainId;
    private _eth_requestAccounts;
    private _eth_sign;
    private _eth_ecRecover;
    private _personal_sign;
    private _personal_ecRecover;
    private _eth_signTransaction;
    private _eth_sendRawTransaction;
    private _eth_sendTransaction;
    private _eth_signTypedData_v1;
    private _eth_signTypedData_v3;
    private _eth_signTypedData_v4;
    private _wallet_addEthereumChain;
    private _wallet_switchEthereumChain;
    private _wallet_watchAsset;
    private initializeRelay;
}