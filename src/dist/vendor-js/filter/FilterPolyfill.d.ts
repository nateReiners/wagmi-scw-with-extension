import { RequestArguments } from '../../core/provider/interface';
import { HexString, IntNumber } from '../../core/type';
type RawHexBlockHeight = HexString | 'earliest' | 'latest' | 'pending';
type IntBlockHeight = IntNumber | 'latest';
export interface FilterParam {
    fromBlock: RawHexBlockHeight | undefined;
    toBlock: RawHexBlockHeight | undefined;
    address?: string | string[];
    topics?: (string | string[])[];
}
export interface Filter {
    fromBlock: IntBlockHeight;
    toBlock: IntBlockHeight;
    addresses: string[] | null;
    topics: (string | string[])[];
}
export declare class FilterPolyfill {
    private readonly sendAsyncPromise;
    private readonly logFilters;
    private readonly blockFilters;
    private readonly pendingTransactionFilters;
    private readonly cursors;
    private readonly timeouts;
    private nextFilterId;
    constructor(fetchRPCFunction: (request: RequestArguments) => Promise<unknown>);
    request(request: RequestArguments): Promise<{
        error: {
            code: number;
            message: string;
        };
    } | {
        result: unknown;
    }>;
    newFilter(param: FilterParam): Promise<HexString>;
    newBlockFilter(): Promise<HexString>;
    newPendingTransactionFilter(): Promise<HexString>;
    uninstallFilter(filterId: HexString): boolean;
    getFilterChanges(filterId: HexString): Promise<{
        error: {
            code: number;
            message: string;
        };
    } | {
        result: unknown;
    }>;
    getFilterLogs(filterId: HexString): Promise<{
        error: {
            code: number;
            message: string;
        };
    } | {
        result: unknown;
    }>;
    private makeFilterId;
    private deleteFilter;
    private getLogFilterChanges;
    private getBlockFilterChanges;
    private getPendingTransactionFilterChanges;
    private setInitialCursorPosition;
    private setFilterTimeout;
    private readonly REQUEST_THROTTLE_INTERVAL;
    private lastFetchTimestamp;
    private currentBlockHeight?;
    private resolvers;
    getCurrentBlockHeight(): Promise<IntNumber>;
    _getCurrentBlockHeight(): Promise<IntNumber>;
    private getBlockHashByNumber;
}
export declare function filterFromParam(param: FilterParam): Filter;
export {};
