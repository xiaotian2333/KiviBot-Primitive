"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginDataDir = exports.PluginDir = exports.LogDir = exports.DataDir = exports.CWD = void 0;
const node_path_1 = require("node:path");
exports.CWD = process.cwd();
exports.DataDir = (0, node_path_1.join)(exports.CWD, 'data/oicq');
exports.LogDir = (0, node_path_1.join)(exports.CWD, 'logs');
exports.PluginDir = (0, node_path_1.join)(exports.CWD, 'plugins');
exports.PluginDataDir = (0, node_path_1.join)(exports.CWD, 'data/plugins');
__exportStar(require("./start"), exports);
