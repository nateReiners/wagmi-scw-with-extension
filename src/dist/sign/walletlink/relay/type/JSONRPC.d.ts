export type JSONRPCMethod = 'eth_accounts' | 'eth_coinbase' | 'net_version' | 'eth_chainId' | 'eth_uninstallFilter' | 'eth_requestAccounts' | 'eth_sign' | 'eth_ecRecover' | 'personal_sign' | 'personal_ecRecover' | 'eth_signTransaction' | 'eth_sendRawTransaction' | 'eth_sendTransaction' | 'eth_signTypedData_v1' | 'eth_signTypedData_v2' | 'eth_signTypedData_v3' | 'eth_signTypedData_v4' | 'eth_signTypedData' | 'walletlink_arbitrary' | 'wallet_addEthereumChain' | 'wallet_switchEthereumChain' | 'wallet_watchAsset' | 'eth_subscribe' | 'eth_unsubscribe' | 'eth_newFilter' | 'eth_newBlockFilter' | 'eth_newPendingTransactionFilter' | 'eth_getFilterChanges' | 'eth_getFilterLogs';
export interface JSONRPCRequest<T = any> {
    jsonrpc: '2.0';
    id: number;
    method: string;
    params: T;
}
export interface JSONRPCResponse<T = any, U = any> {
    jsonrpc: '2.0';
    id: number;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: U;
    } | null;
}
