"use strict";
// Copyright (c) 2018-2023 Coinbase, Inc. <https://www.coinbase.com/>
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterFromParam = exports.FilterPolyfill = void 0;
const error_1 = require("../core/error");
const type_1 = require("../core/type");
const util_1 = require("../core/type/util");
const TIMEOUT = 5 * 60 * 1000; // 5 minutes
class FilterPolyfill {
    constructor(fetchRPCFunction) {
        this.logFilters = new Map(); // <id, filter>
        this.blockFilters = new Set(); // <id>
        this.pendingTransactionFilters = new Set(); // <id, true>
        this.cursors = new Map(); // <id, cursor>
        this.timeouts = new Map(); // <id, setTimeout id>
        this.nextFilterId = (0, type_1.IntNumber)(1);
        this.REQUEST_THROTTLE_INTERVAL = 1000; // in milliseconds
        this.lastFetchTimestamp = new Date(0);
        this.resolvers = [];
        this.sendAsyncPromise = async (request) => {
            const result = await fetchRPCFunction(request);
            return { result };
        };
    }
    async request(request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = request.params || [];
        const filterIdParam = () => (0, util_1.ensureHexString)(params[0]);
        switch (request.method) {
            case 'eth_newFilter':
                return { result: await this.newFilter(params[0]) };
            case 'eth_newBlockFilter':
                return { result: await this.newBlockFilter() };
            case 'eth_newPendingTransactionFilter':
                return { result: await this.newPendingTransactionFilter() };
            case 'eth_getFilterChanges':
                return this.getFilterChanges(filterIdParam());
            case 'eth_getFilterLogs':
                return this.getFilterLogs(filterIdParam());
            case 'eth_uninstallFilter':
                return { result: await this.uninstallFilter(filterIdParam()) };
        }
        return Promise.reject(error_1.standardErrors.rpc.methodNotFound());
    }
    async newFilter(param) {
        const filter = filterFromParam(param);
        const id = this.makeFilterId();
        const cursor = await this.setInitialCursorPosition(id, filter.fromBlock);
        console.info(`Installing new log filter(${id}):`, filter, 'initial cursor position:', cursor);
        this.logFilters.set(id, filter);
        this.setFilterTimeout(id);
        return (0, util_1.hexStringFromIntNumber)(id);
    }
    async newBlockFilter() {
        const id = this.makeFilterId();
        const cursor = await this.setInitialCursorPosition(id, 'latest');
        console.info(`Installing new block filter (${id}) with initial cursor position:`, cursor);
        this.blockFilters.add(id);
        this.setFilterTimeout(id);
        return (0, util_1.hexStringFromIntNumber)(id);
    }
    async newPendingTransactionFilter() {
        const id = this.makeFilterId();
        const cursor = await this.setInitialCursorPosition(id, 'latest');
        console.info(`Installing new block filter (${id}) with initial cursor position:`, cursor);
        this.pendingTransactionFilters.add(id);
        this.setFilterTimeout(id);
        return (0, util_1.hexStringFromIntNumber)(id);
    }
    uninstallFilter(filterId) {
        const id = (0, util_1.intNumberFromHexString)(filterId);
        console.info(`Uninstalling filter (${id})`);
        this.deleteFilter(id);
        return true;
    }
    getFilterChanges(filterId) {
        const id = (0, util_1.intNumberFromHexString)(filterId);
        if (this.timeouts.has(id)) {
            // extend timeout
            this.setFilterTimeout(id);
        }
        if (this.logFilters.has(id)) {
            return this.getLogFilterChanges(id);
        }
        else if (this.blockFilters.has(id)) {
            return this.getBlockFilterChanges(id);
        }
        else if (this.pendingTransactionFilters.has(id)) {
            return this.getPendingTransactionFilterChanges(id);
        }
        return Promise.resolve(filterNotFoundError());
    }
    async getFilterLogs(filterId) {
        const id = (0, util_1.intNumberFromHexString)(filterId);
        const filter = this.logFilters.get(id);
        if (!filter) {
            return filterNotFoundError();
        }
        return this.sendAsyncPromise({
            method: 'eth_getLogs',
            params: [paramFromFilter(filter)],
        });
    }
    makeFilterId() {
        return (0, type_1.IntNumber)(++this.nextFilterId);
    }
    deleteFilter(id) {
        console.info(`Deleting filter (${id})`);
        this.logFilters.delete(id);
        this.blockFilters.delete(id);
        this.pendingTransactionFilters.delete(id);
        this.cursors.delete(id);
        this.timeouts.delete(id);
    }
    async getLogFilterChanges(id) {
        const filter = this.logFilters.get(id);
        const cursorPosition = this.cursors.get(id);
        if (!cursorPosition || !filter) {
            return filterNotFoundError();
        }
        const currentBlockHeight = await this.getCurrentBlockHeight();
        const toBlock = filter.toBlock === 'latest' ? currentBlockHeight : filter.toBlock;
        if (cursorPosition > currentBlockHeight) {
            return emptyResult();
        }
        if (cursorPosition > Number(filter.toBlock)) {
            return emptyResult();
        }
        console.info(`Fetching logs from ${cursorPosition} to ${toBlock} for filter ${id}`);
        const response = await this.sendAsyncPromise({
            method: 'eth_getLogs',
            params: [
                paramFromFilter(Object.assign(Object.assign({}, filter), { fromBlock: cursorPosition, toBlock })),
            ],
        });
        if (Array.isArray(response.result)) {
            const blocks = response.result.map((log) => (0, util_1.intNumberFromHexString)(log.blockNumber || '0x0'));
            const highestBlock = Math.max(...blocks);
            if (highestBlock && highestBlock > cursorPosition) {
                const newCursorPosition = (0, type_1.IntNumber)(highestBlock + 1);
                console.info(`Moving cursor position for filter (${id}) from ${cursorPosition} to ${newCursorPosition}`);
                this.cursors.set(id, newCursorPosition);
            }
        }
        return response;
    }
    async getBlockFilterChanges(id) {
        const cursorPosition = this.cursors.get(id);
        if (!cursorPosition) {
            return filterNotFoundError();
        }
        const currentBlockHeight = await this.getCurrentBlockHeight();
        if (cursorPosition > currentBlockHeight) {
            return emptyResult();
        }
        console.info(`Fetching blocks from ${cursorPosition} to ${currentBlockHeight} for filter (${id})`);
        const blocks = (await Promise.all(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        (0, util_1.range)(cursorPosition, currentBlockHeight + 1).map((i) => this.getBlockHashByNumber((0, type_1.IntNumber)(i))))).filter((hash) => !!hash);
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const newCursorPosition = (0, type_1.IntNumber)(cursorPosition + blocks.length);
        console.info(`Moving cursor position for filter (${id}) from ${cursorPosition} to ${newCursorPosition}`);
        this.cursors.set(id, newCursorPosition);
        return { result: blocks };
    }
    async getPendingTransactionFilterChanges(_id) {
        // pending transaction filters are not supported
        return Promise.resolve(emptyResult());
    }
    async setInitialCursorPosition(id, startBlock) {
        const currentBlockHeight = await this.getCurrentBlockHeight();
        const initialCursorPosition = typeof startBlock === 'number' && startBlock > currentBlockHeight
            ? startBlock
            : currentBlockHeight;
        this.cursors.set(id, initialCursorPosition);
        return initialCursorPosition;
    }
    setFilterTimeout(id) {
        const existing = this.timeouts.get(id);
        if (existing) {
            window.clearTimeout(existing);
        }
        const timeout = window.setTimeout(() => {
            console.info(`Filter (${id}) timed out`);
            this.deleteFilter(id);
        }, TIMEOUT);
        this.timeouts.set(id, timeout);
    }
    // throttle eth_blockNumber requests
    async getCurrentBlockHeight() {
        const now = new Date();
        if (now.getTime() - this.lastFetchTimestamp.getTime() > this.REQUEST_THROTTLE_INTERVAL) {
            this.lastFetchTimestamp = now;
            const height = await this._getCurrentBlockHeight();
            this.currentBlockHeight = height;
            this.resolvers.forEach((resolve) => resolve(height));
            this.resolvers = [];
        }
        if (!this.currentBlockHeight) {
            return new Promise((resolve) => this.resolvers.push(resolve));
        }
        return this.currentBlockHeight;
    }
    async _getCurrentBlockHeight() {
        const { result } = await this.sendAsyncPromise({
            method: 'eth_blockNumber',
            params: [],
        });
        return (0, util_1.intNumberFromHexString)((0, util_1.ensureHexString)(result));
    }
    async getBlockHashByNumber(blockNumber) {
        var _a;
        const response = await this.sendAsyncPromise({
            method: 'eth_getBlockByNumber',
            params: [(0, util_1.hexStringFromIntNumber)(blockNumber), false],
        });
        const hash = (_a = response.result) === null || _a === void 0 ? void 0 : _a.hash;
        if (hash) {
            return (0, util_1.ensureHexString)(hash);
        }
        return null;
    }
}
exports.FilterPolyfill = FilterPolyfill;
function filterFromParam(param) {
    return {
        fromBlock: intBlockHeightFromHexBlockHeight(param.fromBlock),
        toBlock: intBlockHeightFromHexBlockHeight(param.toBlock),
        addresses: param.address === undefined
            ? null
            : Array.isArray(param.address)
                ? param.address
                : [param.address],
        topics: param.topics || [],
    };
}
exports.filterFromParam = filterFromParam;
function paramFromFilter(filter) {
    const param = {
        fromBlock: hexBlockHeightFromIntBlockHeight(filter.fromBlock),
        toBlock: hexBlockHeightFromIntBlockHeight(filter.toBlock),
        topics: filter.topics,
    };
    if (filter.addresses !== null) {
        param.address = filter.addresses;
    }
    return param;
}
function intBlockHeightFromHexBlockHeight(value) {
    if (value === undefined || value === 'latest' || value === 'pending') {
        return 'latest';
    }
    else if (value === 'earliest') {
        return (0, type_1.IntNumber)(0);
    }
    else if ((0, util_1.isHexString)(value)) {
        return (0, util_1.intNumberFromHexString)(value);
    }
    throw new Error(`Invalid block option: ${String(value)}`);
}
function hexBlockHeightFromIntBlockHeight(value) {
    if (value === 'latest') {
        return value;
    }
    return (0, util_1.hexStringFromIntNumber)(value);
}
function filterNotFoundError() {
    return {
        error: { code: -32000, message: 'filter not found' },
    };
}
function emptyResult() {
    return { result: [] };
}
//# sourceMappingURL=FilterPolyfill.js.map