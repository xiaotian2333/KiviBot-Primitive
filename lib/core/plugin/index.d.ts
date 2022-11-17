/// <reference types="node" />
import cron from 'node-cron';
import EventEmitter from 'node:events';
import type { Client, DiscussMessageEvent, GroupMessageEvent, PrivateMessageEvent } from 'oicq';
import type { ScheduleOptions } from 'node-cron';
type MessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent;
type MessageHandler = (event: MessageEvent, bot: Client) => any;
type MessageCmdHandler = (event: MessageEvent, args: string[], bot: Client) => any;
export declare class PluginError extends Error {
    name: string;
    pluginName: string;
    message: string;
    constructor(name: string, message?: string);
}
export declare class Plugin extends EventEmitter {
    private _name;
    private _bot;
    private _task;
    private _events;
    private _messageFuncs;
    private _cmdFuncs;
    constructor(name: string);
    private error;
    mount(bot: Client): void;
    unmount(bot: Client): void;
    cron(cronStr: string, func: (bot: Client, cronStr: string) => void, options?: ScheduleOptions): cron.ScheduledTask;
    message(hander: MessageHandler): void;
    cmd(cmd: string | RegExp, hander: MessageCmdHandler): void;
}
export {};
