"use strict";
// Copyright (c) 2018-2023 Coinbase, Inc. <https://www.coinbase.com/>
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrorResponse = isErrorResponse;
function isErrorResponse(response) {
    return response.errorMessage !== undefined;
}
