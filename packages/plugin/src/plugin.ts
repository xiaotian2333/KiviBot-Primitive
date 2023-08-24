import { Logger } from '@kivi-dev/core'
import { b, mri, ensureArray, watch, ref, str2argv, deepClone } from '@kivi-dev/shared'
import { defu as mergeDefaults } from 'defu'
import nodeCron from 'node-cron'
import EventEmitter from 'node:events'
import fs from 'node:fs'
import path from 'node:path'

import { KiviEvents, MessageEvents, OicqEvents } from './events.js'

import type { KiviEventMap } from './events.js'
import type {
  AdminArray,
  AllMessageEvent,
  AnyFunc,
  BotConfig,
  BotHandler,
  ClientWithApis,
  CommandHandler,
  FirstParam,
  MessageHandler,
  MessageType,
  ScheduledTask,
} from '@kivi-dev/types'
import type { Client, EventMap } from 'icqq'

export class Plugin extends EventEmitter {
  #name = ''
  #version = ''
  #dataDir = ''

  #bot?: ClientWithApis
  #botConfig?: BotConfig
  #pluginConfig?: unknown

  #apiNames: Set<string> = new Set()
  #mountFns: BotHandler[] = []
  #unmountFns: BotHandler[] = []
  #handlers: Map<string, AnyFunc[]> = new Map()
  #cronTasks: ScheduledTask[] = []

  #logger: Logger = new Logger('Plugin')

  get bot() {
    this.#checkInit()

    return this.#bot!
  }

  get logger() {
    return this.#logger
  }

  get admins() {
    return this.#botConfig!.admins
  }

  async init(bot: ClientWithApis, config: BotConfig, cwd: string) {
    if (!this.#name) {
      return this.#throwPluginError(`请在插件中调用 ${b('setup')} 函数设置插件名称`)
    }

    this.#bot = bot
    this.#botConfig = config
    this.#dataDir = path.join(cwd, `data/plugins/${this.#name}`)

    if (!fs.existsSync(this.#dataDir)) {
      fs.mkdirSync(this.#dataDir, { recursive: true })
    }

    // 监听框架管理变动
    const unsubscribe = bot.on('kivi.admins', this.#adminChangeHandler)
    this.#addHandler('kivi.admins', unsubscribe)

    this.#mountFns.forEach(async (fn) => {
      const un = fn(this.#bot!)
      this.#unmountFns.push(un instanceof Promise ? await un : un)
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
    await Promise.all(this.#unmountFns.map((fn) => typeof fn === 'function' && fn(this.#bot!)))

    this.#clearCronTasks()
    this.#removeAllHandler()
    this.#unregisterAllApi()

    this.#bot = undefined
  }

  __setup(name: string, version: string) {
    this.#name = name || '未知插件'
    this.#version = version || '未知版本'
    this.#logger.setName(this.#name)
  }

  __useInfo() {
    this.#checkInit()

    return {
      name: this.#name || '',
      version: this.#version || '',
      dataDir: this.#dataDir || '',
      admins: this.admins || [],
      botConfig: this.#botConfig!,
      mainAdmin: (this.admins ?? [])[0]!,
      subAdmins: [...(this.admins ?? [])].slice(1),
    }
  }

  __useConfig<T extends Record<string | number, any> = Record<string, any>>(
    defaultConfig?: T,
    options: {
      minify?: boolean
    } = { minify: false },
  ): T {
    if (this.#pluginConfig) {
      return this.#pluginConfig as T
    }

    const config: T = deepClone(defaultConfig || {}) as T
    const configPath = path.join(this.#dataDir, 'config.json')

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, { encoding: 'utf-8' })

      try {
        Object.assign(config, JSON.parse(configContent))
      } catch (e) {
        this.#throwPluginError('插件配置文件格式错误，请检查')
      }
    }

    const finalConfig = mergeDefaults(config, defaultConfig || {})
    const rawConfig = JSON.stringify(finalConfig, null, options?.minify ? undefined : 2)

    fs.writeFileSync(configPath, rawConfig, { encoding: 'utf-8' })
    this.#pluginConfig = ref(finalConfig)

    watch(this.#pluginConfig as T, (config) => this.#handleConfigChange(config))

    return this.#pluginConfig as T
  }

  __useMount(fn: BotHandler) {
    this.#mountFns.push(fn)
  }

  __useMessage<T extends MessageType = 'all'>(
    handler: MessageHandler<T>,
    option?: {
      type?: T
      role?: 'admin' | 'all'
    },
  ) {
    this.#checkInit()

    const oicqHandler = (e: AllMessageEvent) => {
      if (option?.type === 'private' && e.message_type !== 'private') return
      if (option?.type === 'group' && e.message_type !== 'group') return
      const isAdmin = this.admins.includes(e.sender.user_id)
      if (option?.role === 'admin' && !isAdmin) return

      // TODO: fix type error
      handler(e as never)
    }

    const unsubscribe = this.#bot!.on('message', oicqHandler)
    this.#addHandler('message', unsubscribe)
  }

  __useMatch<T extends MessageType = 'all'>(
    matches: string | RegExp | (string | RegExp)[],
    handler: MessageHandler<T>,
    option?: {
      type?: T
      role?: 'admin' | 'all'
    },
  ) {
    this.#checkInit()

    const matchList = ensureArray(matches)

    const oicqHandler = (e: AllMessageEvent) => {
      if (option?.type === 'private' && e.message_type !== 'private') return
      if (option?.type === 'group' && e.message_type !== 'group') return

      const isAdmin = this.admins.includes(e.sender.user_id)

      if (option?.role === 'admin' && !isAdmin) return

      const msg = e.toString()

      for (const match of matchList) {
        const isReg = match instanceof RegExp

        const hitReg = isReg && match.test(msg)
        const hitString = !isReg && match === msg

        if (hitReg || hitString) {
          // TODO: fix type error
          handler(e as never)
          break
        }
      }
    }

    const unsubscribe = this.#bot!.on('message', oicqHandler)
    this.#addHandler('message', unsubscribe)
  }

  __useCmd<T extends MessageType = 'all'>(
    cmds: string | string[],
    handler: CommandHandler<T> | Record<string, CommandHandler<T>>,
    option?: {
      type?: T
      role?: 'admin' | 'all'
    },
  ) {
    this.#checkInit()

    const oicqHandler = (e: AllMessageEvent) => {
      if (option?.type === 'private' && e.message_type !== 'private') return
      if (option?.type === 'group' && e.message_type !== 'group') return

      const isAdmin = this.admins.includes(e.sender.user_id)

      if (option?.role === 'admin' && !isAdmin) return

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _: params, '--': __, ...options } = mri(str2argv(e.toString().trim()))
      const inputCmd = params.shift() || ''
      const cmdList = ensureArray(cmds)

      for (const cmd of cmdList) {
        if (cmd === inputCmd) {
          if (typeof handler === 'function') {
            handler(e as never, params, options)
          } else {
            const defaultHandler = (event: any) => {
              const subCmds = Object.keys(handler)
                .filter((e) => !['default', 'notFound'].includes(e))
                .map((e) => `${cmd} ${e}`)
              event.reply(subCmds.length ? subCmds.join('\n') : `${cmd} 未定义任何子命令`)
            }

            const subHandler = handler[params[0] || 'default'] || defaultHandler

            subHandler(e as never, params.slice(1), options)
          }
          break
        }
      }
    }

    const unsubscribe = this.bot!.on('message', oicqHandler)
    this.#addHandler('message', unsubscribe)
  }

  __registerApi<T extends AnyFunc = AnyFunc>(method: string, fn: T) {
    this.#checkInit()

    if (this.#apiNames.has(method) || method in plugin.#bot!.apis) {
      this.#throwPluginError(`api ${b(method)} 已经被注册，请尝试使用其它名称`)
    }

    this.#apiNames.add(method)

    plugin.#bot!.apis[method] = fn
  }

  __useApi<T extends AnyFunc = AnyFunc>(method: string) {
    this.#checkInit()

    if (!plugin.#bot!.apis[method]) {
      this.#throwPluginError(`API ${b(method)} 不存在，请检查是否已在插件中注册`)
    }

    return plugin.#bot!.apis[method] as T
  }

  __useCron(cronExpression: string, handler: AnyFunc) {
    this.#checkInit()

    // 检验 cron 表达式有效性
    const isSyntaxOK = nodeCron.validate(cronExpression)

    if (!isSyntaxOK) {
      this.#throwPluginError(`无效的 ${b('crontab')} 表达式`)
    }

    // 创建 cron 任务
    const task = nodeCron.schedule(cronExpression, () => handler(this.bot!))

    this.#cronTasks.push(task)

    return task as ScheduledTask
  }

  #checkInit() {
    if (!this.#bot) {
      this.#throwPluginError(`此时插件还未初始化！请在 ${b('useMount')} 中执行。`)
    }
  }

  #handleConfigChange(config: Record<string, any>) {
    const configPath = path.join(this.#dataDir, 'config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  }

  #throwPluginError(message: string) {
    this.#logger.error(message)
    throw new Error(message)
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

  #unregisterAllApi() {
    this.#apiNames.forEach((name) => delete plugin.#bot!.apis[name])
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
export const bot = () => plugin.bot
export const setup = plugin.__setup.bind(plugin)
export const logger = plugin.logger

export const useMount = plugin.__useMount.bind(plugin)
export const useMessage = plugin.__useMessage.bind(plugin)
export const useMatch = plugin.__useMatch.bind(plugin)
export const useCmd = plugin.__useCmd.bind(plugin)
export const useEvent = plugin.on.bind(plugin)
export const useCron = plugin.__useCron.bind(plugin)
export const useInfo = plugin.__useInfo.bind(plugin)
export const useConfig = plugin.__useConfig.bind(plugin)

export const registerApi = plugin.__registerApi.bind(plugin)
export const useApi = plugin.__useApi.bind(plugin)
