import fs from 'fs-extra'
import minimist from 'minimist'
import { log4js } from 'movo'
import nodeCron from 'node-cron'
import EventEmitter from 'node:events'
import path from 'node:path'
import { str2argv } from 'string2argv'

import { PluginError } from './pluginError'
import { KeliEvents, MessageEvents, OicqEvents } from '@/core'
import { PluginDataDir } from '@/src'
import { ensureArray, stringifyError } from '@/utils'

import type { AdminArray, MainAdmin, KeliEventMap } from '@/core'
import type { Logger } from 'log4js'
import type {
  Client,
  DiscussMessageEvent,
  EventMap,
  GroupMessageEvent,
  PrivateMessageEvent
} from 'movo'
import type { ScheduledTask } from 'node-cron'

export type AnyFunc = (...args: any[]) => any
export type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
export type AllMessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
export type OicqMessageHandler = (event: AllMessageEvent) => any
export type MessageHandler = (event: AllMessageEvent, bot: Client) => any
export type PrivateMessageHandler = (event: PrivateMessageEvent, bot: Client) => any
export type GroupMessageHandler = (event: GroupMessageEvent, bot: Client) => any

/**
 * 处理函数
 *
 * @param {Client} bot Bot 实例
 * @param {AdminArray} admins 管理员列表
 */
export type BotHandler = (bot: Client, admins: AdminArray) => any

/**
 * 命令消息处理函数
 * @param {AllMessageEvent} event oicq 消息事件，包含了群聊、私聊与讨论组消息
 * @param {string[]} params 由 minimist 解析后的 `_` 值（不包含命令），可以看作命令的其余参数
 * @param {{[arg: string]: any}} options 由 minimist 解析后的值（不包含 `_` 和 `--`），可以看作命令选项
 */
export type MessageCmdHandler = (
  event: AllMessageEvent,
  params: string[],
  options: {
    [arg: string]: any
  }
) => any

export interface PluginConf {
  debug?: boolean
  enableGroups?: number[]
  enableFriends?: number[]
}

export class Plugin extends EventEmitter {
  /** 插件名称 */
  public name: string
  /** 插件版本 */
  public version: string
  /** 向框架输出日志记录器，是 log4js 的实例 */
  public logger: Logger = log4js.getLogger('plugin')
  /** 挂载的 Bot 实例 */
  public bot: Client | null = null
  /** 插件配置 */
  public config: PluginConf = {}
  private _cronTasks: ScheduledTask[] = []
  private _handlers: Map<string, AnyFunc[]> = new Map()

  /**
   * keli 插件类
   *
   * @param {string} name 插件名称，建议英文，插件数据目录以此结尾
   * @param {string} version 插件版本，如 1.0.0，建议 require package.json 的版本号统一管理
   * @param conf
   */
  constructor(name: string, version: string, conf?: PluginConf) {
    super()

    this.name = name ?? 'null'
    this.version = version ?? 'null'
    this._dataDir = path.join(PluginDataDir, this.name)
    this.config = conf ?? {}

    this.debug('create Plugin instance')
  }

  private _admins: AdminArray | undefined

  /**
   * 框架管理员列表 (getter)，插件会自动监听变动事件，并保证列表是实时最新的
   */
  get admins() {
    this.checkMountStatus()
    return [...(this._admins || [])] as AdminArray
  }

  private readonly _dataDir = path.join(PluginDataDir, 'null')

  /**
   * 插件数据存放目录，`框架目录/data/plugins/<name>` 注意这里的 name 是实例化的时候传入的 name
   */
  get dataDir() {
    if (!fs.existsSync(this._dataDir)) {
      fs.ensureDirSync(this._dataDir)
    }
    return this._dataDir
  }

  /**
   * 框架主管理员 (getter)，插件会自动监听变动事件，并保证列表是实时最新的
   */
  get mainAdmin() {
    this.checkMountStatus()
    return [...(this._admins || [])][0] as MainAdmin
  }

  /**
   * 框架副管理员列表 (getter)，插件会自动监听变动事件，并保证列表是实时最新的
   */
  get subAdmins() {
    this.checkMountStatus()
    return (this._admins || []).slice(1) as number[]
  }

  /**
   * 抛出一个 keli 插件标准错误，会被框架捕获并输出到日志
   *
   * @param {string} message 错误信息
   */
  throwPluginError(message: string) {
    throw new PluginError(this.name, message)
  }

  /**
   * **插件请勿调用**，keli 框架调用此函数启用插件
   * @param {Client} bot oicq Client 实例
   * @param {AdminArray} admins 框架管理员列表
   * @return {Promise<Plugin>} 插件实例 Promise
   */
  async mountKeliClient(bot: Client, admins: AdminArray): Promise<Plugin> {
    this.debug('mountKeliClient')

    // 挂载 Bot
    this.bot = bot

    // 初始化管理员
    this._admins = [...admins]

    // 监听框架管理变动
    bot.on('keli.admins', this.adminChangeHandler)

    try {
      this.debug('_mounted')

      // 调用 onMounted 挂载的函数
      const res = this._mounted(bot, [...this._admins])

      // 如果是 Promise 等待其执行完
      if (res instanceof Promise) await res
    } catch (e) {
      this.throwPluginError('error occurred in onMounted:\n' + stringifyError(e))
    }

    this.debug('add all keli events listeners')

    // 插件监听 keli 的所有事件
    KeliEvents.forEach((evt) => {
      const handler = (e: FirstParam<KeliEventMap<Client>[typeof evt]>) => {
        this.emit(evt, e)
      }

      // 插件收到事件时，将事件及数据 emit 给插件里定义的处理函数
      bot.on(evt, handler)

      // 收集监听函数
      this.addHandler(evt, handler)
    })

    this.debug('add all oicq events listeners')

    // 插件监听 oicq 的所有事件
    OicqEvents.forEach((evt) => {
      const handler = (e: FirstParam<EventMap<Client>[typeof evt]>) => {
        if (MessageEvents.includes(evt as any)) {
          const event = e as AllMessageEvent

          if (this.isTargetOn(event)) {
            this.emit(evt, event)
          }
        } else {
          this.emit(evt, e)
        }
      }

      // 插件收到事件时，将事件及数据 emit 给插件里定义的处理函数
      bot.on(evt, handler)

      // 收集监听函数
      this.addHandler(evt, handler)
    })

    return this
  }

  /**
   * **插件请勿调用**，keli 框架调用此函数禁用插件
   * @param {Client} bot oicq Client 实例
   * @param {AdminArray} admins 框架管理员列表
   */
  async unmountKeliClient(bot: Client, admins: AdminArray) {
    this.debug('unmountKeliClient')

    // 取消监听框架管理变动
    bot.off('keli.admins', this.adminChangeHandler)

    try {
      this.debug('_unmounted')

      // 调用 onUnmounted 挂载的函数
      const res = this._unmounted(bot, admins)

      // 如果是 Promise 等待其执行完
      if (res instanceof Promise) await res
    } catch (e) {
      this.throwPluginError('error occurred in onUnmounted:\n' + stringifyError(e))
    }

    this.removeAllHandler()
    this.clearCronTasks()

    this.bot = null
  }

  /**
   * 从插件数据目录加载保存的数据（储存为 JSON 格式，读取为普通 JS 对象），配置不存在时返回默认值，默认为 {} 空对象
   * @param {string} filepath 保存文件路径，默认为插件数据目录下的 `config.json`
   * @param {any} defaultValue 不存在时的默认值
   * @param {fs.ReadOptions | undefined} options 加载配置的选项
   * @return {any} 读取到的数据
   */
  loadConfig(
    filepath: string = path.join(this.dataDir, 'config.json'),
    defaultValue: any = {},
    options: fs.ReadOptions | undefined = {}
  ): any {
    this.debug('loadConfig')

    if (fs.existsSync(filepath)) {
      try {
        return fs.readJsonSync(filepath, options)
      } catch (e) {
        this.throwPluginError('error occurred when reading plugin config, path: ' + filepath)
      }
    } else {
      return defaultValue
    }
  }

  /**
   * 将数据保存到插件数据目录（传入普通 JS 对象，储存为 JSON 格式）
   * @param {any} data 待保存的普通 JS 对象
   * @param {string} filepath 保存文件路径，默认为，默认为插件数据目录下的 `config.json`
   * @param {fs.ReadOptions | undefined} options 写入配置的选项
   * @return {boolean} 是否写入成功
   */
  saveConfig(
    data: any,
    filepath: string = path.join(this.dataDir, 'config.json'),
    options: fs.WriteOptions | undefined = {}
  ): boolean {
    this.debug('saveConfig')

    try {
      fs.writeJsonSync(filepath, data, { spaces: 2, ...options })

      return true
    } catch (e) {
      this.throwPluginError('error occurred when writing plugin config, path: ' + filepath)
      return false
    }
  }

  /**
   * 添加消息监听函数，包括好友私聊、群消息以及讨论组消息，通过 `message_type` 判断消息类型。
   * @param {MessageHandler} handler 消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onMessage(handler: MessageHandler) {
    this.checkMountStatus()

    const oicqHandler = (e: AllMessageEvent) => {
      if (this.isTargetOn(e)) {
        handler(e, this.bot!)
      }
    }

    this.bot!.on('message', oicqHandler)
    this.addHandler('message', oicqHandler)
  }

  /**
   * 添加群聊消息监听函数，等价于 plugin.on('message.group', handler) 。
   * @param {GroupMessageHandler} handler 群聊消息处理函数
   */
  onGroupMessage(handler: GroupMessageHandler) {
    this.checkMountStatus()

    const oicqHandler = (e: GroupMessageEvent) => {
      if (this.isTargetOn(e)) {
        handler(e, this.bot!)
      }
    }

    this.bot!.on('message.group', oicqHandler)
    this.addHandler('message.group', oicqHandler)
  }

  /**
   * 添加私聊消息监听函数，等价于 plugin.on('message.private', handler) 。
   * @param {PrivateMessageHandler} handler 私聊消息处理函数
   */
  onPrivateMessage(handler: PrivateMessageHandler) {
    this.checkMountStatus()

    const oicqHandler = (e: PrivateMessageEvent) => {
      if (this.isTargetOn(e)) {
        handler(e, this.bot!)
      }
    }

    this.bot!.on('message.private', oicqHandler)
    this.addHandler('message.private', oicqHandler)
  }

  /**
   * 消息匹配函数，传入字符串或正则，或字符串和正则的数组，进行精确匹配，匹配成功则调用函数
   * @param {string | RegExp | (string | RegExp)[]} matches 待匹配的内容，字符串或者正则，对整个消息进行匹配
   * @param {MessageHandler} handler 消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onMatch(matches: string | RegExp | (string | RegExp)[], handler: MessageHandler) {
    this.checkMountStatus()

    const matchList = ensureArray(matches)

    const oicqHandler = (e: AllMessageEvent) => {
      if (this.isTargetOn(e)) {
        const msg = e.toString()

        for (const match of matchList) {
          const isReg = match instanceof RegExp

          const hitReg = isReg && match.test(msg)
          const hitString = !isReg && match === msg

          if (hitReg || hitString) {
            handler(e, this.bot!)
            break
          }
        }
      }
    }

    this.bot!.on('message', oicqHandler)
    this.addHandler('message', oicqHandler)
  }

  /**
   * 群消息匹配函数，传入字符串或正则，或字符串和正则的数组，进行精确匹配，匹配成功则调用函数
   * @param {string | RegExp | (string | RegExp)[]} matches 待匹配的内容，字符串或者正则，对整个消息进行匹配
   * @param {GroupMessageHandler} handler 群消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onGroupMatch(matches: string | RegExp | (string | RegExp)[], handler: GroupMessageHandler) {
    this.checkMountStatus()

    const matchList = ensureArray(matches)

    const oicqHandler = (e: GroupMessageEvent) => {
      if (this.isTargetOn(e)) {
        const msg = e.toString()

        for (const match of matchList) {
          const isReg = match instanceof RegExp

          const hitReg = isReg && match.test(msg)
          const hitString = !isReg && match === msg

          if (hitReg || hitString) {
            handler(e, this.bot!)
            break
          }
        }
      }
    }

    this.bot!.on('message.group', oicqHandler)
    this.addHandler('message.group', oicqHandler)
  }

  /**
   * 私聊消息匹配函数，传入字符串或正则，或字符串和正则的数组，进行精确匹配，匹配成功则调用函数
   * @param {string | RegExp | (string | RegExp)[]} matches 待匹配的内容，字符串或者正则，对整个消息进行匹配
   * @param {PrivateMessageHandler} handler 私聊消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onPrivateMatch(matches: string | RegExp | (string | RegExp)[], handler: PrivateMessageHandler) {
    this.checkMountStatus()

    const matchList = ensureArray(matches)

    const oicqHandler = (e: PrivateMessageEvent) => {
      if (this.isTargetOn(e)) {
        const msg = e.toString()

        for (const match of matchList) {
          const isReg = match instanceof RegExp

          const hitReg = isReg && match.test(msg)
          const hitString = !isReg && match === msg

          if (hitReg || hitString) {
            handler(e, this.bot!)
            break
          }
        }
      }
    }

    this.bot!.on('message.private', oicqHandler)
    this.addHandler('message.private', oicqHandler)
  }

  /**
   * 管理员消息匹配函数，传入字符串或正则，或字符串和正则的数组，进行精确匹配，匹配成功则调用函数
   * @param {string | RegExp | (string | RegExp)[]} matches 待匹配的内容，字符串或者正则，对整个消息进行匹配
   * @param {MessageHandler} handler 消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onAdminMatch(matches: string | RegExp | (string | RegExp)[], handler: MessageHandler) {
    this.checkMountStatus()

    const matchList = ensureArray(matches)

    const oicqHandler = (e: AllMessageEvent) => {
      if (this.isTargetOn(e)) {
        if (this.admins.includes(e.sender.user_id)) {
          const msg = e.toString()

          for (const match of matchList) {
            const isReg = match instanceof RegExp

            const hitReg = isReg && match.test(msg)
            const hitString = !isReg && match === msg

            if (hitReg || hitString) {
              handler(e, this.bot!)
              break
            }
          }
        }
      }
    }

    this.bot!.on('message', oicqHandler)
    this.addHandler('message', oicqHandler)
  }

  /**
   * 添加命令监听函数，通过 `message_type` 判断消息类型。如果只需要监听特定的消息类型，请使用 `on` 监听，比如 `on('message.group')`
   * @param {string | RegExp | (string | RegExp)[]} cmds 监听的命令，可以是字符串或正则表达式，或字符串和正则的数组
   * @param {MessageCmdHandler} handler 消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onCmd(cmds: string | RegExp | (string | RegExp)[], handler: MessageCmdHandler) {
    this.checkMountStatus()

    const oicqHandler = (e: AllMessageEvent) => {
      if (this.isTargetOn(e)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _: params, '--': __, ...options } = minimist(str2argv(e.toString().trim()))
        const inputCmd = params.shift() ?? ''
        const cmdList = ensureArray(cmds)

        for (const cmd of cmdList) {
          const isReg = cmd instanceof RegExp
          const hitReg = isReg && cmd.test(inputCmd)
          const hitString = !isReg && cmd === inputCmd

          if (hitReg || hitString) {
            handler(e, params, options)
            break
          }
        }
      }
    }

    this.bot!.on('message', oicqHandler)
    this.addHandler('message', oicqHandler)
  }

  /**
   * 添加管理员命令监听函数，通过 `message_type` 判断消息类型。如果只需要监听特定的消息类型，请使用 `on` 监听，比如 `on('message.group')`
   * @param {string | RegExp | (string | RegExp)[]} cmds 监听的命令，可以是字符串或正则表达式，或字符串和正则的数组
   * @param {MessageCmdHandler} handler 消息处理函数，包含群消息，讨论组消息和私聊消息
   */
  onAdminCmd(cmds: string | RegExp | (string | RegExp)[], handler: MessageCmdHandler) {
    this.checkMountStatus()

    const oicqHandler = (e: AllMessageEvent) => {
      if (this.isTargetOn(e)) {
        if (this.admins.includes(e.sender.user_id)) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _: params, '--': __, ...options } = minimist(str2argv(e.toString().trim()))
          const inputCmd = params.shift() ?? ''
          const cmdList = ensureArray(cmds)

          for (const cmd of cmdList) {
            const isReg = cmd instanceof RegExp
            const hitReg = isReg && cmd.test(inputCmd)
            const hitString = !isReg && cmd === inputCmd

            if (hitReg || hitString) {
              handler(e, params, options)
              break
            }
          }
        }
      }
    }

    this.bot!.on('message', oicqHandler)
    this.addHandler('message', oicqHandler)
  }

  /**
   * 插件被启用时执行，所有的插件实例调用相关的逻辑请写到传入的函数里
   * @param {BotHandler} func 插件被挂载后的执行函数
   */
  onMounted(func: BotHandler) {
    this.debug('onMounted')

    this._mounted = func
  }

  /**
   * 插件被禁用时执行，所有的插件实例调用相关的逻辑请写到传入的函数里
   * @param {BotHandler} func 插件被取消挂载后的执行函数
   */
  onUnmounted(func: BotHandler) {
    this.debug('onUnmounted')

    this._unmounted = func
  }

  /**
   * 打印消息到控制台
   */
  log(...args: any[]) {
    const mapFn = (e: any) => (typeof e === 'object' ? JSON.stringify(e, null, 2) : e)
    const msg = args.map(mapFn).join(', ')
    this.logger.log(`${this.name}: ${msg}`)
  }

  /**
   * 打印消息到控制台，用于插件调试，仅在 debug 以及更低的 log lever 下可见
   */
  debug(...args: any[]) {
    const mapFn = (e: any) => (typeof e === 'object' ? JSON.stringify(e, null, 2) : e)
    const msg = args.map(mapFn).join(', ')
    this.logger.debug(`${this.name}: ${msg}`)
  }

  /**
   * 添加定时任务，插件禁用时会自动清理，无需手动处理
   *
   * @param {string} cronExpression crontab 表达式, [秒], 分, 时, 日, 月, 星期
   * @param {BotHandler} fn 定时触发的函数
   * @return {ScheduledTask} 定时任务 Task 实例
   */
  cron(cronExpression: string, fn: BotHandler): ScheduledTask {
    this.checkMountStatus()

    // 检验 cron 表达式有效性
    const isSyntaxOK = nodeCron.validate(cronExpression)

    if (!isSyntaxOK) {
      this.throwPluginError('invalid cron expression')
    }

    // 创建 cron 任务
    const task = nodeCron.schedule(cronExpression, () => fn(this.bot!, this._admins!))

    this._cronTasks.push(task)

    return task
  }

  private _mounted: BotHandler = () => {}

  private _unmounted: BotHandler = () => {}

  /**
   * 检测是否已经挂载 bot 实例，未挂载抛出插件错误
   */
  private checkMountStatus() {
    if (!this.bot) {
      this.throwPluginError(
        'Bot (Client) has not been mounted in this time, please ensure that only call bot in onMounted and onUnmounted'
      )
    }
  }

  /**
   * 框架管理变动事件处理函数
   */
  private adminChangeHandler(event: { admins: AdminArray }) {
    this._admins = event.admins
  }

  /**
   * 添加监听函数
   */
  private addHandler(eventName: string, handler: AnyFunc) {
    const handlers = this._handlers.get(eventName)
    this._handlers.set(eventName, handlers ? [...handlers, handler] : [handler])
  }

  /**
   * 取消所有监听
   */
  private removeAllHandler() {
    this.debug('removeAllHandler')

    for (const [eventName, handlers] of this._handlers) {
      handlers.forEach((handler) => this.bot!.off(eventName, handler))
    }
  }

  /**
   * 清理所有定时任务
   */
  private clearCronTasks() {
    this.debug('clearCronTasks')

    this._cronTasks.forEach((task) => task.stop())
  }

  /** 目标群或者好友是否被启用，讨论组当作群聊处理 */
  private isTargetOn(event: AllMessageEvent) {
    const { enableFriends, enableGroups } = this.config

    const isPrivate = event.message_type === 'private'
    const isGroup = event.message_type === 'group'
    const isDiscuss = event.message_type === 'discuss'

    const isUserEnable = isPrivate && enableFriends?.includes(event.sender.user_id)
    const isGroupEnable =
      (isGroup && enableGroups?.includes(event.group_id)) ||
      (isDiscuss && enableGroups?.includes(event.discuss_id))

    if (isPrivate && (!enableFriends || isUserEnable)) {
      return true
    }

    if (!isPrivate && (!enableGroups || isGroupEnable)) {
      return true
    }

    return false
  }
}

/**
 * keli 插件类
 */
export interface Plugin extends EventEmitter {
  /** @deprecated 请使用 on 进行事件监听 */
  addListener: never
  /** @deprecated 请使用 off 取消事件监听 */
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

  /** 监听 oicq 标准事件以及 keli 标准事件 */
  on<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this

  /** 监听自定义事件或其他插件触发的事件 */
  on<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this

  /** 单次监听 oicq 标准事件以及 keli 标准事件 */
  once<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this

  /** 单次监听自定义事件或其他插件触发的事件 */
  once<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this

  /** 取消监听 oicq 标准事件以及 keli 标准事件 */
  off<T extends keyof EventMap>(event: T, listener: EventMap<this>[T]): this

  /** 取消监听自定义事件或其他插件触发的事件 */
  off<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void
  ): this
}
