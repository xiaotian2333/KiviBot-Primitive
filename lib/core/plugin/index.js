"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = exports.PluginError = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const node_events_1 = __importDefault(require("node:events"));
const events_1 = __importDefault(require("./events"));
const parseCommand_1 = __importDefault(require("../../utils/parseCommand"));
class PluginError extends Error {
    constructor(name, message) {
        super();
        this.name = 'PluginError';
        this.pluginName = name;
        this.message = message !== null && message !== void 0 ? message : '';
    }
}
exports.PluginError = PluginError;
class Plugin extends node_events_1.default {
    constructor(name) {
        super();
        this._name = '';
        this._task = [];
        this._events = new Map();
        this._messageFuncs = new Map();
        this._cmdFuncs = new Map();
        this._name = name;
    }
    error(message) {
        throw new PluginError(this._name, message);
    }
    // 插件被框架挂载（启用）时被框架调用
    mount(bot) {
        // 插件监听 ociq 的所有事件
        events_1.default.forEach((evt) => {
            const handler = (e) => this.emit(evt, e, bot);
            // 插件收到事件时，将事件及数据转 emit 给插件里定义的处理函数
            bot.on(evt, handler);
            // this._event 保存所有监听函数的引用，在卸载时通过这个引用取消监听
            this._events.set(evt, handler);
        });
        // plugin.message() 添加进来的处理函数
        this._messageFuncs.forEach((_, handler) => {
            const oicqHandler = (e) => handler(e, bot);
            bot.on('message', oicqHandler);
            this._messageFuncs.set(handler, oicqHandler);
        });
        // plugin.cmd() 添加进来的处理函数
        this._cmdFuncs.forEach((cmd, handler) => {
            const reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd}($|\\s+)`);
            const oicqHandler = (e) => {
                if (reg.test(e.raw_message)) {
                    const args = (0, parseCommand_1.default)(e.raw_message);
                    handler(e, args, bot);
                }
            };
            bot.on('message', oicqHandler);
            this._cmdFuncs.set(handler, oicqHandler);
        });
    }
    // 插件被取消挂载（禁用）时被框架调用
    unmount(bot) {
        // 取消所有定时任务
        this._task.forEach((e) => e.stop());
        // 取消监听 oicq 的所有事件
        events_1.default.forEach((evt) => {
            const handler = this._events.get(evt);
            if (handler) {
                bot.off(evt, handler);
            }
        });
        // plugin.message() 添加进来的处理函数
        this._messageFuncs.forEach((oicqHandler) => {
            bot.off('message', oicqHandler);
        });
        // plugin.cmd() 添加进来的处理函数
        this._cmdFuncs.forEach((oicqHandler) => {
            bot.off('message', oicqHandler);
        });
    }
    cron(cronStr, func, options) {
        const isCronValid = node_cron_1.default.validate(cronStr);
        if (!isCronValid) {
            this.error('Cron 表达式有误，请参考框架文档');
        }
        const handler = () => {
            if (this._bot) {
                func(this._bot, cronStr);
            }
            else {
                this.error('Bot 实例未挂载');
            }
        };
        const task = node_cron_1.default.schedule(cronStr, handler, options);
        this._task.push(task);
        return task;
    }
    message(hander) {
        this._messageFuncs.set(hander, null);
    }
    cmd(cmd, hander) {
        this._cmdFuncs.set(hander, cmd);
    }
}
exports.Plugin = Plugin;
const plugin = new Plugin('百度百科');
const task1 = plugin.cron('10:20', async (bot) => { });
const task2 = plugin.cron('10:20', (bot) => { });
task1.stop();
plugin.message(async (event, bot) => event.reply('Hello'));
plugin.cmd('你好', (event, args, bot) => event.reply('Hello'));
// plugin.adminCmd('#开启本群', (event, args, bot) => {
//   // 读写 plugins.enableGroups 会自动 persist data
//   if (plugins.enableGroups.has(event.group_id)) {
//     event.reply('当前群已经是开启状态')
//   } else {
//     plugins.enableGroups.add(event.group_id)
//     event.reply('已开启')
//   }
// })
// plugin.on('message', (e, bot) => e.reply('Hello World'))
// plugin.on('system.', (e, bot) => e.reply('Hello World'))
