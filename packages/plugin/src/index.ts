import { Logger } from '@kivi-dev/core'
import { b } from '@kivi-dev/shared'
import EventEmitter from 'node:events'
import path from 'node:path'

import { KiviEvents, MessageEvents, OicqEvents } from './events.js'

import type { KiviEventMap } from './events.js'
import type {
  AdminArray,
  AllMessageEvent,
  AnyFunc,
  BotConfig,
  ClientWithApis,
  FirstParam,
} from '@kivi-dev/types'
import type { Client, EventMap } from 'icqq'
import type { ScheduledTask } from 'node-cron'

export class Plugin extends EventEmitter {
  #name = ''
  #version = ''
  #dataDir = ''

  #bot?: ClientWithApis
  #botConfig?: BotConfig

  #apiNames: Set<string> = new Set()
  #mountFns: AnyFunc[] = []
  #unmountFns: AnyFunc[] = []
  #handlers: Map<string, AnyFunc[]> = new Map()
  #cronTasks: ScheduledTask[] = []

  logger = new Logger('Plugin')

  get bot() {
    return this.#bot!
  }

  init(bot: ClientWithApis, config: BotConfig, cwd: string) {
    this.#bot = bot
    this.#botConfig = config
    this.#dataDir = path.join(cwd, `data/plugins/${this.#name}`)

    // 监听框架管理变动
    const unsubscribe = bot.on('kivi.admins', this.#adminChangeHandler)
    this.#addHandler('kivi.admins', unsubscribe)

    this.#mountFns.forEach(async (fn) => {
      const unmountFn = fn()

      if (unmountFn instanceof Promise) {
        this.#unmountFns.push(await unmountFn)
      } else {
        this.#unmountFns.push(unmountFn)
      }
    })

    KiviEvents.forEach((eventName) => {
      const handler = (eventPayload: FirstParam<KiviEventMap<Client>[typeof eventName]>) => {
        this.emit(eventName, eventPayload)
      }

      // 插件收到事件时，将事件及数据 emit 给插件里定义的处理函数
      const unsubscribe = bot.on(eventName, handler)

      // 收集监听函数
      this.#addHandler(eventName, unsubscribe)
    })

    // 插件监听 oicq 的所有事件
    OicqEvents.forEach((eventName) => {
      const handler = (eventPayload: FirstParam<EventMap[typeof eventName]>) => {
        if (MessageEvents.includes(eventName as any)) {
          this.emit(eventName, eventPayload as AllMessageEvent)
        } else {
          this.emit(eventName, eventPayload)
        }
      }

      // 插件收到事件时，将事件及数据 emit 给插件里定义的处理函数
      const unsubscribe = bot.on(eventName, handler)

      // 收集监听函数
      this.#addHandler(eventName, unsubscribe)
    })
  }

  async destroy() {
    await Promise.all(
      this.#unmountFns.map(async (fn) => {
        const res = typeof fn === 'function' && fn()
        if (res instanceof Promise) return await res
      }),
    )

    this.#clearCronTasks()
    this.#removeAllHandler()
    this.#unregisterAllApi()

    this.#bot = undefined
  }

  #throwPluginError(message: string) {
    this.logger.error(`[${b(this.#name || '未知插件')}] ` + message)
  }

  __useSetup(name: string, version: string) {
    this.#name = name || ''
    this.#version = version || ''
  }

  __useConfig(type?: 'kivi' | 'plugin') {
    return {
      name: this.#name || '',
      version: this.#version || '',
      dataDir: this.#dataDir || '',
      admins: this.admins || [],
      mainAdmin: (this.admins ?? [])[0]!,
      subAdmins: [...(this.admins ?? [])].slice(1),
    }
  }

  get admins() {
    return this.#botConfig?.admins ?? []
  }

  #addHandler(eventName: string, handler: AnyFunc) {
    const handlers = this.#handlers.get(eventName)
    this.#handlers.set(eventName, handlers ? [...handlers, handler] : [handler])
  }

  #removeAllHandler() {
    for (const [_, handlers] of this.#handlers) {
      handlers.forEach((unsubscribe) => unsubscribe())
    }
  }

  #adminChangeHandler(event: { admins: AdminArray }) {
    this.#botConfig = {
      ...this.#botConfig,
      admins: event.admins,
    } as BotConfig
  }

  #clearCronTasks() {
    this.#cronTasks.forEach((task) => task.stop())
  }

  __useMount(fn: AnyFunc) {
    this.#mountFns.push(fn)
  }

  __useMatch(
    fn: AnyFunc,
    option?: {
      type?: 'all' | 'private' | 'group'
      role?: 'admin' | 'all'
    },
  ) {}

  __useCommand(
    fn: AnyFunc,
    option?: {
      type?: 'all' | 'private' | 'group'
      role?: 'admin' | 'all'
    },
  ) {}

  __registerApi<T extends AnyFunc = AnyFunc>(method: string, fn: T) {
    if (!this.#bot) {
      this.#throwPluginError(`请在 ${b(method)} 方法中调用 ${b('registerApi')}`)
    }

    if (this.#apiNames.has(method) || method in plugin.#bot!.apis) {
      this.#throwPluginError(`api ${b(method)} 已经被注册，请尝试使用其它名称`)
    }

    this.#apiNames.add(method)

    plugin.#bot!.apis[method] = fn
  }

  __useApi<T extends AnyFunc = AnyFunc>(method: string) {
    if (!this.#bot) {
      this.#throwPluginError(`请在 ${b(method)} 方法中调用 ${b('useApi')}`)
    }

    if (!plugin.#bot!.apis[method]) {
      this.#throwPluginError(`API ${b(method)} 不存在，请检查是否已在插件中注册`)
    }

    return plugin.#bot!.apis[method] as T
  }

  #unregisterAllApi() {
    this.#apiNames.forEach((name) => {
      delete plugin.#bot!.apis[name]
    })
  }
}

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
  /** @deprecated 不推荐使用 */
  removeListener: never
  /** @deprecated 不推荐使用 */
  prependListener: never
  /** @deprecated 不推荐使用 */
  prependOnceListener: never

  /** 监听 oicq 标准事件以及 Kivi 标准事件 */
  on<T extends keyof EventMap>(event: T, listener: EventMap[T]): this

  /** 监听自定义事件或其他插件触发的事件 */
  on<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this

  /** 单次监听 oicq 标准事件以及 Kivi 标准事件 */
  once<T extends keyof EventMap>(event: T, listener: EventMap[T]): this

  /** 单次监听自定义事件或其他插件触发的事件 */
  once<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this

  /** 取消监听 oicq 标准事件以及 Kivi 标准事件 */
  off<T extends keyof EventMap>(event: T, listener: EventMap[T]): this

  /** 取消监听自定义事件或其他插件触发的事件 */
  off<S extends string | symbol>(
    event: S & Exclude<S, keyof EventMap>,
    listener: (this: this, ...args: any[]) => void,
  ): this
}

export const plugin = new Plugin()
export const setup = plugin.__useSetup.bind(plugin)

export const useOn = plugin.on.bind(plugin)
export const useBot = () => plugin.bot

export const useApi = plugin.__useApi.bind(plugin)
export const useCmd = plugin.__useCommand.bind(plugin)
export const useMount = plugin.__useMount.bind(plugin)
export const useMatch = plugin.__useMatch.bind(plugin)
export const useConfig = plugin.__useConfig.bind(plugin)
export const registerApi = plugin.__registerApi.bind(plugin)
