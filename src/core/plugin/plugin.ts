import EventEmitter from 'node:events'

import { KiviPluginError } from './pluginError'
import { OicqEvents } from './events'
import parseCommand from '@/utils/parseCommand'

import type {
  Client,
  DiscussMessageEvent,
  EventMap,
  GroupMessageEvent,
  PrivateMessageEvent
} from 'oicq'

import type { AdminArray } from '../start'

export type AnyFunc = (...args: any[]) => any
export type MainAdmin = number

export type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
export type AllMessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
export type OicqMessageHandler = (event: AllMessageEvent) => any
export type MessageHandler = (event: AllMessageEvent) => any
export type BotHandler = (bot: Client, admins: AdminArray) => any
export type MessageCmdHandler = (event: AllMessageEvent, args: string[]) => any

export class KiviPlugin extends EventEmitter {
  private _name: string
  private _mounted: BotHandler = () => {}
  private _unmounted: BotHandler = () => {}
  private _admins: AdminArray | undefined
  private _events: Map<string, AnyFunc> = new Map()
  private _messageFuncs: Map<MessageHandler, OicqMessageHandler | null> = new Map()
  private _cmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()
  private _adminCmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()

  public CWD: string = process.cwd()

  /** KiviBot 插件类 */
  constructor(name: string) {
    super()
    this._name = name
  }

  /** 抛出一个 KiviBot 插件标准错误，会被框架捕获 */
  throwError(message: string) {
    throw new KiviPluginError(this._name, message)
  }

  /** 框架管理变动事件处理函数 */
  private adminChangeHandler(event: { admins: AdminArray }) {
    this._admins = event.admins
  }

  /** 插件被框架挂载（启用）时被框架调用 */
  async _mount(bot: Client, admins: AdminArray) {
    // 初始化管理员
    this._admins = [...admins]
    // 监听框架管理变动
    bot.on('kivi.admins', this.adminChangeHandler)

    try {
      // 调用 onMounted 挂载的函数
      const res = this._mounted(bot, [...this._admins])

      // 如果是 Promise 等待其执行完
      if (res instanceof Promise) await res
    } catch (e: any) {
      this.throwError('插件挂载（onMounted）过程中发生错误: ' + e)
    }

    // 插件监听 ociq 的所有事件
    OicqEvents.forEach((evt) => {
      const handler = (e: FirstParam<EventMap<Client>[typeof evt]>) => this.emit(evt, e)

      // 插件收到事件时，将事件及数据 emit 给插件里定义的处理函数
      bot.on(evt, handler)

      // this._event 保存所有监听函数的引用，在卸载时通过这个引用取消监听
      this._events.set(evt, handler)
    })

    // plugin.message() 添加进来的处理函数
    this._messageFuncs.forEach((_, handler) => {
      const oicqHandler = (e: AllMessageEvent) => handler(e)
      bot.on('message', oicqHandler)
      this._messageFuncs.set(handler, oicqHandler)
    })

    // plugin.cmd() 添加进来的处理函数
    this._cmdFuncs.forEach((cmd, handler) => {
      const reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd as string}($|\\s+)`)

      const oicqHandler = (e: AllMessageEvent) => {
        if (reg.test(e.raw_message)) {
          const { params } = parseCommand(e.raw_message)
          handler(e, params)
        }
      }

      bot.on('message', oicqHandler)

      this._cmdFuncs.set(handler, oicqHandler)
    })

    // plugin.adminCmd() 添加进来的处理函数
    this._adminCmdFuncs.forEach((cmd, handler) => {
      const reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd as string}($|\\s+)`)

      const oicqHandler = (e: AllMessageEvent) => {
        const isAdmin = admins.includes(e.sender.user_id)

        if (isAdmin && reg.test(e.raw_message)) {
          const { params } = parseCommand(e.raw_message)
          handler(e, params)
        }
      }

      bot.on('message', oicqHandler)

      this._adminCmdFuncs.set(handler, oicqHandler)
    })
  }

  /** 插件被取消挂载（禁用）时被框架调用 */
  async _unmount(bot: Client, admins: AdminArray) {
    // 取消监听框架管理变动
    bot.off('kivi.admins', this.adminChangeHandler)

    // 取消监听 oicq 的所有事件
    OicqEvents.forEach((evt) => bot.off(evt, this._events.get(evt)!))

    // plugin.message() plugin.admincCmd() 和 plugin.cmd() 添加进来的处理函数
    const funcs = [...this._messageFuncs, ...this._cmdFuncs, ...this._adminCmdFuncs]

    // 取出 oicq handlers
    const oicqHandlers = funcs.map((e) => e[1] as OicqMessageHandler)

    // 卸载时通过 oicq handlers 取消监听
    oicqHandlers.forEach((oicqHandler) => bot.off('message', oicqHandler))

    try {
      // 调用 onUnmounted 挂载的函数
      const res = this._unmounted(bot, admins)

      // 如果是 Promise 等待其执行完
      if (res instanceof Promise) await res
    } catch (e: any) {
      this.throwError('插件卸载（onUnmounted）过程中发生错误: ' + e)
    }
  }

  /** 添加所有消息监听函数 */
  onMessage(hander: MessageHandler) {
    this._messageFuncs.set(hander, null)
  }

  /** 添加全员命令监听函数 */
  onCmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  /** 添加管理员命令监听函数 */
  onAdminCmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  /** 绑定挂载函数 */
  onMounted(func: BotHandler) {
    this._mounted = func
  }

  /** 绑定卸载函数 */
  onUnmounted(func: BotHandler) {
    this._unmounted = func
  }

  get admins() {
    return [...(this._admins || [])] as AdminArray
  }
}

/** KiviBot 插件类 */
export interface KiviPlugin extends EventEmitter {
  /** 监听 oicq 标准事件以及 KiviBot 标准事件 */
  on<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this
  /** 监听自定义事件或其他插件触发的事件 */
  on<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this
  /** 单次监听 oicq 标准事件以及 KiviBot 标准事件 */
  once<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this
  /** 单次监听自定义事件或其他插件触发的事件 */
  once<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this
  /** 取消监听 oicq 标准事件以及 KiviBot 标准事件 */
  off<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this
  /** 取消监听自定义事件或其他插件触发的事件 */
  off<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this
}
