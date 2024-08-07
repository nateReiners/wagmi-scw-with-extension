import { AddressString, IntNumber } from '../../../../core/type';
export interface EthereumTransactionParams {
    fromAddress: AddressString;
    toAddress: AddressString | null;
    weiValue: bigint;
    data: Buffer;
    nonce: IntNumber | null;
    gasPriceInWei: bigint | null;
    maxFeePerGas: bigint | null;
    maxPriorityFeePerGas: bigint | null;
    gasLimit: bigint | null;
    chainId: IntNumber;
}
