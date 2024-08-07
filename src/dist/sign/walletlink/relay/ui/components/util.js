"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQrUrl = createQrUrl;
exports.getLocation = getLocation;
exports.isMobileWeb = isMobileWeb;
exports.isDarkMode = isDarkMode;
function createQrUrl(sessionId, sessionSecret, serverUrl, isParentConnection, version, chainId) {
    const sessionIdKey = isParentConnection ? 'parent-id' : 'id';
    const query = new URLSearchParams({
        [sessionIdKey]: sessionId,
        secret: sessionSecret,
        server: serverUrl,
        v: version,
        chainId: chainId.toString(),
    }).toString();
    const qrUrl = `${serverUrl}/#/link?${query}`;
    return qrUrl;
}
function isInIFrame() {
    try {
        return window.frameElement !== null;
    }
    catch (e) {
        return false;
    }
}
function getLocation() {
    try {
        if (isInIFrame() && window.top) {
            return window.top.location;
        }
        return window.location;
    }
    catch (e) {
        return window.location;
    }
}
function isMobileWeb() {
    var _a;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test((_a = window === null || window === void 0 ? void 0 : window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent);
}
function isDarkMode() {
    var _a, _b;
    return (_b = (_a = window === null || window === void 0 ? void 0 : window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, '(prefers-color-scheme: dark)').matches) !== null && _b !== void 0 ? _b : false;
}
