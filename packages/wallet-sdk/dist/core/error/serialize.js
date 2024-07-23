"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeError = serializeError;
// TODO: error should not depend on walletlink. revisit this.
const Web3Response_1 = require("../../sign/walletlink/relay/type/Web3Response");
const version_1 = require("../../version");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**
 * Serializes an error to a format that is compatible with the Ethereum JSON RPC error format.
 * See https://docs.cloud.coinbase.com/wallet-sdk/docs/errors
 * for more information.
 */
function serializeError(error) {
    const serialized = (0, utils_1.serialize)(getErrorObject(error), {
        shouldIncludeStack: true,
    });
    const docUrl = new URL('https://docs.cloud.coinbase.com/wallet-sdk/docs/errors');
    docUrl.searchParams.set('version', version_1.LIB_VERSION);
    docUrl.searchParams.set('code', serialized.code.toString());
    docUrl.searchParams.set('message', serialized.message);
    return Object.assign(Object.assign({}, serialized), { docUrl: docUrl.href });
}
/**
 * Converts an error to a serializable object.
 */
function getErrorObject(error) {
    if (typeof error === 'string') {
        return {
            message: error,
            code: constants_1.standardErrorCodes.rpc.internal,
        };
    }
    else if ((0, Web3Response_1.isErrorResponse)(error)) {
        return Object.assign(Object.assign({}, error), { message: error.errorMessage, code: error.errorCode, data: { method: error.method } });
    }
    return error;
}
//# sourceMappingURL=serialize.js.map