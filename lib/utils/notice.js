"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faild = exports.success = exports.warn = exports.info = void 0;
const colors_1 = __importDefault(require("./colors"));
const info = (msg) => {
    console.log(`${colors_1.default.blue('Info:')} ${msg}`);
};
exports.info = info;
const warn = (msg) => {
    console.log(`${colors_1.default.yellow('Warn:')} ${msg}`);
};
exports.warn = warn;
const success = (msg) => {
    console.log(`${colors_1.default.green('Sucess:')} ${msg}`);
};
exports.success = success;
const faild = (msg) => {
    console.log(`${colors_1.default.red('Faild:')} ${msg}`);
};
exports.faild = faild;
const notice = { info: exports.info, warn: exports.warn, success: exports.success, faild: exports.faild };
exports.default = notice;
