"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notice_1 = __importDefault(require("./notice"));
const exitWithError = (msg) => {
    notice_1.default.faild(msg);
    process.exit(1);
};
exports.default = exitWithError;
