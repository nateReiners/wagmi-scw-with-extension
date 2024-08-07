"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) 2018-2023 Coinbase, Inc. <https://www.coinbase.com/>
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomBytesHex = randomBytesHex;
exports.uint8ArrayToHex = uint8ArrayToHex;
exports.hexStringToUint8Array = hexStringToUint8Array;
exports.hexStringFromBuffer = hexStringFromBuffer;
exports.bigIntStringFromBigInt = bigIntStringFromBigInt;
exports.intNumberFromHexString = intNumberFromHexString;
exports.hexStringFromIntNumber = hexStringFromIntNumber;
exports.has0xPrefix = has0xPrefix;
exports.strip0x = strip0x;
exports.prepend0x = prepend0x;
exports.isHexString = isHexString;
exports.ensureHexString = ensureHexString;
exports.ensureEvenLengthHexString = ensureEvenLengthHexString;
exports.ensureAddressString = ensureAddressString;
exports.ensureBuffer = ensureBuffer;
exports.ensureIntNumber = ensureIntNumber;
exports.ensureRegExpString = ensureRegExpString;
exports.ensureBigInt = ensureBigInt;
exports.ensureParsedJSONObject = ensureParsedJSONObject;
exports.isBigNumber = isBigNumber;
exports.range = range;
exports.getFavicon = getFavicon;
exports.areAddressArraysEqual = areAddressArraysEqual;
const error_1 = require("../error");
const _1 = require(".");
const INT_STRING_REGEX = /^[0-9]*$/;
const HEXADECIMAL_STRING_REGEX = /^[a-f0-9]*$/;
/**
 * @param length number of bytes
 */
function randomBytesHex(length) {
    return uint8ArrayToHex(crypto.getRandomValues(new Uint8Array(length)));
}
function uint8ArrayToHex(value) {
    return [...value].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hexStringToUint8Array(hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
function hexStringFromBuffer(buf, includePrefix = false) {
    const hex = buf.toString('hex');
    return (0, _1.HexString)(includePrefix ? `0x${hex}` : hex);
}
function bigIntStringFromBigInt(bi) {
    return (0, _1.BigIntString)(bi.toString(10));
}
function intNumberFromHexString(hex) {
    return (0, _1.IntNumber)(Number(BigInt(ensureEvenLengthHexString(hex, true))));
}
function hexStringFromIntNumber(num) {
    return (0, _1.HexString)(`0x${BigInt(num).toString(16)}`);
}
function has0xPrefix(str) {
    return str.startsWith('0x') || str.startsWith('0X');
}
function strip0x(hex) {
    if (has0xPrefix(hex)) {
        return hex.slice(2);
    }
    return hex;
}
function prepend0x(hex) {
    if (has0xPrefix(hex)) {
        return `0x${hex.slice(2)}`;
    }
    return `0x${hex}`;
}
function isHexString(hex) {
    if (typeof hex !== 'string') {
        return false;
    }
    const s = strip0x(hex).toLowerCase();
    return HEXADECIMAL_STRING_REGEX.test(s);
}
function ensureHexString(hex, includePrefix = false) {
    if (typeof hex === 'string') {
        const s = strip0x(hex).toLowerCase();
        if (HEXADECIMAL_STRING_REGEX.test(s)) {
            return (0, _1.HexString)(includePrefix ? `0x${s}` : s);
        }
    }
    throw error_1.standardErrors.rpc.invalidParams(`"${String(hex)}" is not a hexadecimal string`);
}
function ensureEvenLengthHexString(hex, includePrefix = false) {
    let h = ensureHexString(hex, false);
    if (h.length % 2 === 1) {
        h = (0, _1.HexString)(`0${h}`);
    }
    return includePrefix ? (0, _1.HexString)(`0x${h}`) : h;
}
function ensureAddressString(str) {
    if (typeof str === 'string') {
        const s = strip0x(str).toLowerCase();
        if (isHexString(s) && s.length === 40) {
            return (0, _1.AddressString)(prepend0x(s));
        }
    }
    throw error_1.standardErrors.rpc.invalidParams(`Invalid Ethereum address: ${String(str)}`);
}
function ensureBuffer(str) {
    if (Buffer.isBuffer(str)) {
        return str;
    }
    if (typeof str === 'string') {
        if (isHexString(str)) {
            const s = ensureEvenLengthHexString(str, false);
            return Buffer.from(s, 'hex');
        }
        return Buffer.from(str, 'utf8');
    }
    throw error_1.standardErrors.rpc.invalidParams(`Not binary data: ${String(str)}`);
}
function ensureIntNumber(num) {
    if (typeof num === 'number' && Number.isInteger(num)) {
        return (0, _1.IntNumber)(num);
    }
    if (typeof num === 'string') {
        if (INT_STRING_REGEX.test(num)) {
            return (0, _1.IntNumber)(Number(num));
        }
        if (isHexString(num)) {
            return (0, _1.IntNumber)(Number(BigInt(ensureEvenLengthHexString(num, true))));
        }
    }
    throw error_1.standardErrors.rpc.invalidParams(`Not an integer: ${String(num)}`);
}
function ensureRegExpString(regExp) {
    if (regExp instanceof RegExp) {
        return (0, _1.RegExpString)(regExp.toString());
    }
    throw error_1.standardErrors.rpc.invalidParams(`Not a RegExp: ${String(regExp)}`);
}
function ensureBigInt(val) {
    if (val !== null && (typeof val === 'bigint' || isBigNumber(val))) {
        return BigInt(val.toString(10));
    }
    if (typeof val === 'number') {
        return BigInt(ensureIntNumber(val));
    }
    if (typeof val === 'string') {
        if (INT_STRING_REGEX.test(val)) {
            return BigInt(val);
        }
        if (isHexString(val)) {
            return BigInt(ensureEvenLengthHexString(val, true));
        }
    }
    throw error_1.standardErrors.rpc.invalidParams(`Not an integer: ${String(val)}`);
}
function ensureParsedJSONObject(val) {
    if (typeof val === 'string') {
        return JSON.parse(val);
    }
    if (typeof val === 'object') {
        return val;
    }
    throw error_1.standardErrors.rpc.invalidParams(`Not a JSON string or an object: ${String(val)}`);
}
function isBigNumber(val) {
    if (val == null || typeof val.constructor !== 'function') {
        return false;
    }
    const { constructor } = val;
    return typeof constructor.config === 'function' && typeof constructor.EUCLID === 'number';
}
function range(start, stop) {
    return Array.from({ length: stop - start }, (_, i) => start + i);
}
function getFavicon() {
    const el = document.querySelector('link[sizes="192x192"]') ||
        document.querySelector('link[sizes="180x180"]') ||
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]');
    const { protocol, host } = document.location;
    const href = el ? el.getAttribute('href') : null;
    if (!href || href.startsWith('javascript:') || href.startsWith('vbscript:')) {
        return null;
    }
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('data:')) {
        return href;
    }
    if (href.startsWith('//')) {
        return protocol + href;
    }
    return `${protocol}//${host}${href}`;
}
function areAddressArraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}
