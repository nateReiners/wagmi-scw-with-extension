"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptContent = exports.encryptContent = exports.importKeyFromHexString = exports.exportKeyToHexString = exports.decrypt = exports.encrypt = exports.deriveSharedSecret = exports.generateKeyPair = void 0;
const util_1 = require("../util");
async function generateKeyPair() {
    return crypto.subtle.generateKey({
        name: 'ECDH',
        namedCurve: 'P-256',
    }, true, ['deriveKey']);
}
exports.generateKeyPair = generateKeyPair;
async function deriveSharedSecret(ownPrivateKey, peerPublicKey) {
    return crypto.subtle.deriveKey({
        name: 'ECDH',
        public: peerPublicKey,
    }, ownPrivateKey, {
        name: 'AES-GCM',
        length: 256,
    }, false, ['encrypt', 'decrypt']);
}
exports.deriveSharedSecret = deriveSharedSecret;
async function encrypt(sharedSecret, plainText) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherText = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv,
    }, sharedSecret, new TextEncoder().encode(plainText));
    return { iv, cipherText };
}
exports.encrypt = encrypt;
async function decrypt(sharedSecret, { iv, cipherText }) {
    const plainText = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv,
    }, sharedSecret, cipherText);
    return new TextDecoder().decode(plainText);
}
exports.decrypt = decrypt;
function getFormat(keyType) {
    switch (keyType) {
        case 'public':
            return 'spki';
        case 'private':
            return 'pkcs8';
    }
}
async function exportKeyToHexString(type, key) {
    const format = getFormat(type);
    const exported = await crypto.subtle.exportKey(format, key);
    return (0, util_1.uint8ArrayToHex)(new Uint8Array(exported));
}
exports.exportKeyToHexString = exportKeyToHexString;
async function importKeyFromHexString(type, hexString) {
    const format = getFormat(type);
    const arrayBuffer = (0, util_1.hexStringToUint8Array)(hexString).buffer;
    return await crypto.subtle.importKey(format, arrayBuffer, {
        name: 'ECDH',
        namedCurve: 'P-256',
    }, true, type === 'private' ? ['deriveKey'] : []);
}
exports.importKeyFromHexString = importKeyFromHexString;
async function encryptContent(content, sharedSecret) {
    const serialized = JSON.stringify(content, (_, value) => {
        if (!(value instanceof Error))
            return value;
        const error = value;
        return Object.assign(Object.assign({}, (error.code ? { code: error.code } : {})), { message: error.message });
    });
    return encrypt(sharedSecret, serialized);
}
exports.encryptContent = encryptContent;
async function decryptContent(encryptedData, sharedSecret) {
    return JSON.parse(await decrypt(sharedSecret, encryptedData));
}
exports.decryptContent = decryptContent;
//# sourceMappingURL=Cipher.js.map