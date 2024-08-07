"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRPCRequest = fetchRPCRequest;
exports.checkErrorForInvalidRequestArgs = checkErrorForInvalidRequestArgs;
const version_1 = require("../version");
const error_1 = require("../core/error");
async function fetchRPCRequest(request, chain) {
    if (!(chain === null || chain === void 0 ? void 0 : chain.rpcUrl))
        throw error_1.standardErrors.rpc.internal('No RPC URL set for chain');
    const requestBody = Object.assign(Object.assign({}, request), { jsonrpc: '2.0', id: crypto.randomUUID() });
    const res = await window.fetch(chain.rpcUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'X-Cbw-Sdk-Version': version_1.LIB_VERSION },
    });
    const response = await res.json();
    return response.result;
}
/**
 * Validates the arguments for an invalid request and returns an error if any validation fails.
 * Valid request args are defined here: https://eips.ethereum.org/EIPS/eip-1193#request
 * @param args The request arguments to validate.
 * @returns An error object if the arguments are invalid, otherwise undefined.
 */
function checkErrorForInvalidRequestArgs(args) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
        throw error_1.standardErrors.rpc.invalidParams({
            message: 'Expected a single, non-array, object argument.',
            data: args,
        });
    }
    const { method, params } = args;
    if (typeof method !== 'string' || method.length === 0) {
        throw error_1.standardErrors.rpc.invalidParams({
            message: "'args.method' must be a non-empty string.",
            data: args,
        });
    }
    if (params !== undefined &&
        !Array.isArray(params) &&
        (typeof params !== 'object' || params === null)) {
        throw error_1.standardErrors.rpc.invalidParams({
            message: "'args.params' must be an object or array if provided.",
            data: args,
        });
    }
}
