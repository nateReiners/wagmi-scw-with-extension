"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegExpString = exports.IntNumber = exports.BigIntString = exports.AddressString = exports.HexString = exports.OpaqueType = void 0;
function OpaqueType() {
    return (value) => value;
}
exports.OpaqueType = OpaqueType;
exports.HexString = OpaqueType();
exports.AddressString = OpaqueType();
exports.BigIntString = OpaqueType();
function IntNumber(num) {
    return Math.floor(num);
}
exports.IntNumber = IntNumber;
exports.RegExpString = OpaqueType();
//# sourceMappingURL=type.js.map