"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const oicq_1 = require("oicq");
const exitWithError_1 = __importDefault(require("../utils/exitWithError"));
const _1 = require(".");
const configPath = node_path_1.default.join(_1.CWD, 'kivi.json');
const start = () => {
    var _a, _b, _c, _d;
    if (!fs_extra_1.default.existsSync(configPath)) {
        (0, exitWithError_1.default)('配置文件（kivi.json）不存在');
    }
    try {
        const { account, admins, oicq_config } = require(configPath);
        if (!account) {
            (0, exitWithError_1.default)('无效的配置文件（kivi.json）');
        }
        if (admins.length <= 0) {
            (0, exitWithError_1.default)('配置文件中（kivi.json）需要指定至少一个管理员');
        }
        // 未指定协议则默认使用 iPad
        (_a = oicq_config.platform) !== null && _a !== void 0 ? _a : (oicq_config.platform = 5);
        // 默认保存在 data/oicq 下
        (_b = oicq_config.data_dir) !== null && _b !== void 0 ? _b : (oicq_config.data_dir = _1.DataDir);
        // 指定默认 ffmpeg 和 ffprobe 全局路径
        (_c = oicq_config.ffmpeg_path) !== null && _c !== void 0 ? _c : (oicq_config.ffmpeg_path = 'ffmpeg');
        (_d = oicq_config.ffprobe_path) !== null && _d !== void 0 ? _d : (oicq_config.ffprobe_path = 'ffprobe');
        // 初始化实例
        const bot = new oicq_1.Client(account, oicq_config);
        const log = bot.logger.info.bind(bot.logger);
        bot.on('system.online', () => {
            // 捕获全局 Rejection，防止框架崩溃
            process.on('unhandledRejection', (e) => {
                bot.sendPrivateMsg(admins[0], 'Error: ' + e.stack);
            });
            // 捕获全局 Error，防止框架崩溃
            process.on('uncaughtException', (e) => {
                bot.sendPrivateMsg(admins[0], 'Error: ' + e.stack);
            });
            log('bot is online');
        });
        bot.on('message', async (e) => {
            const isMaster = admins.includes(e.sender.user_id);
            const isGroup = e.message_type === 'group';
            const isPrivateGroup = isGroup && [608391254].includes(e.group_id);
            if (isMaster || isPrivateGroup) {
                log(e.raw_message);
                if (e.raw_message === '123') {
                    e.reply('123', true);
                }
                throw new Error();
            }
        });
        const handlerQRcode = () => {
            process.stdin.once('data', () => bot.login());
        };
        bot.on('system.login.qrcode', handlerQRcode).login();
    }
    catch (_e) {
        (0, exitWithError_1.default)('配置文件（kivi.json）不是合法的 JSON 文件');
    }
};
exports.start = start;
