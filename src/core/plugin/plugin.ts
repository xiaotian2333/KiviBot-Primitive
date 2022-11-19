import path from 'node:path'
import EventEmitter from 'node:events'
import { ensureDirSync } from 'fs-extra'

import { PluginDataDir } from '..'
import { KiviPluginError } from './pluginError'
import { OicqEvents } from './events'
import parseCommand from '@src/utils/parseCommand'

import type {
  Client,
  DiscussMessageEvent,
  EventMap,
  GroupMessageEvent,
  PrivateMessageEvent
} from 'oicq'

import type { AdminArray } from '../start'

export type AnyFunc = (...args: any[]) => any

export type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
export type AllMessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
export type OicqMessageHandler = (event: AllMessageEvent) => any
export type MessageHandler = (event: AllMessageEvent) => any
export type BotHandler = (bot: Client, admins: AdminArray) => any
export type MessageCmdHandler = (event: AllMessageEvent, args: string[]) => any

export class KiviPlugin extends EventEmitter {
  /** 插件名称 */
  public name: string

  /** 插件数据存放目录 `/data/plugins/[name]` */
  public pluginDataDir: string

  private _mounted: BotHandler = () => {}
  private _unmounted: BotHandler = () => {}
  private _admins: AdminArray | undefined
  private _events: Map<string, AnyFunc> = new Map()
  private _messageFuncs: Map<MessageHandler, OicqMessageHandler | null> = new Map()
  private _cmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()
  private _adminCmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()

  /** KiviBot 插件类 */
  constructor(name: string) {
    super()
    this.name = name
    this.pluginDataDir = path.join(PluginDataDir, this.name)

    // 确保插件的数据目录存在
    ensureDirSync(this.pluginDataDir)
  }

  /** 抛出一个 KiviBot 插件标准错误，会被框架捕获 */
  throwError(message: string) {
    throw new KiviPluginError(this.name, message)
  }

  /** 框架管理变动事件处理函数 */
  private adminChangeHandler(event: { admins: AdminArray }) {
    this._admins = event.admins
  }

  /** **插件请勿调用**，KiviBot 框架调用此函数启用插件 */
  async mountKiviBotClient(bot: Client, admins: AdminArray) {
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

    return this.name
  }

  /** **插件请勿调用**，KiviBot 框架调用此函数禁用插件 */
  async unmountKiviBotClient(bot: Client, admins: AdminArray) {
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

  /** 添加消息监听函数（包括好友私聊、群消息以及讨论组消息），通过 `message_type` 判断消息类型。如果只需要监听特定的消息类型，请使用 `on` 监听，比如 `on('message.group')` */
  onMessage(hander: MessageHandler) {
    this._messageFuncs.set(hander, null)
  }

  /** 添加命令（可以是字符串或正则表达式）监听函数（包括好友私聊、群消息以及讨论组消息），通过 `message_type` 判断消息类型。如果只需要监听特定的消息类型，请使用 `on` 监听，比如 `on('message.group')` */
  onCmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  /** 添加管理员命令（可以是字符串或正则表达式）监听函数（包括好友私聊、群消息以及讨论组消息），通过 `message_type` 判断消息类型。如果只需要监听特定的消息类型，请使用 `on` 监听，比如 `on('message.group')` */
  onAdminCmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  /** 插件被启用时执行，所有的插件逻辑请写到传入的函数里 */
  onMounted(func: BotHandler) {
    this._mounted = func
  }

  /** 插件被禁用时执行，插件善后逻辑请写到传入的函数里（比如取消定时任务、自定义监听等） */
  onUnmounted(func: BotHandler) {
    this._unmounted = func
  }

  /** 框架管理员列表 (getter)，插件会自动监听变动事件，并保证列表是实时最新的 */
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
  /** @deprecated 请使用 on 进行事件监听 */
  addListener: never
  /** @deprecated 不推荐使用 */
  removeAllListeners: never
  /** @deprecated 不推荐使用 */
  getMaxListeners: never
  /** @deprecated 不推荐使用 */
  rawListeners: never
  /** @deprecated 不推荐使用 */
  setMaxListeners: never
  /** @deprecated 不推荐使用 */
  eventNames: never
  /** @deprecated 不推荐使用 */
  listenerCount: never
  /** @deprecated 不推荐使用 */
  listeners: never
  /** @deprecated *不推荐使用 /
  removeListener: never
  /** @deprecated 不推荐使用 */
  prependListener: never
  /** @deprecated 不推荐使用 */
  prependOnceListener: never
}
