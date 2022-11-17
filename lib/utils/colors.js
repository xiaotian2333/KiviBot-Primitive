"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.white = exports.cyan = exports.magenta = exports.blue = exports.yellow = exports.green = exports.red = void 0;
exports.red = colorful(31);
exports.green = colorful(32);
exports.yellow = colorful(33);
exports.blue = colorful(34);
exports.magenta = colorful(35);
exports.cyan = colorful(36);
exports.white = colorful(37);
exports.default = {
    red: exports.red,
    green: exports.green,
    yellow: exports.yellow,
    blue: exports.blue,
    magenta: exports.magenta,
    cyan: exports.cyan,
    white: exports.white
};
/**
 * 控制台彩色字体
 *
 * @param {number} code - ANSI escape code
 */
function colorful(code) {
    return (msg) => `\u001b[${code}m${msg}\u001b[0m`;
}
