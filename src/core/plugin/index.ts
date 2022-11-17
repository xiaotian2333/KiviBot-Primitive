import cron from 'node-cron'
import EventEmitter from 'node:events'

import OicqEvents from './events'

import type {
  Client,
  DiscussMessageEvent,
  EventMap,
  GroupMessageEvent,
  PrivateMessageEvent
} from 'oicq'

import type { ScheduledTask, ScheduleOptions } from 'node-cron'
import parseCommand from '@/utils/parseCommand'

type AnyFunc = (...args: any[]) => any
type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
type MessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
type OicqMessageHandler = (event: MessageEvent) => any
type MessageHandler = (event: MessageEvent, bot: Client) => any
type MessageCmdHandler = (event: MessageEvent, args: string[], bot: Client) => any

export class PluginError extends Error {
  name = 'PluginError'
  pluginName: string
  message: string

  constructor(name: string, message?: string) {
    super()
    this.pluginName = name
    this.message = message ?? ''
  }
}

export class Plugin extends EventEmitter {
  private _name = ''
  private _bot: Client | undefined
  private _task: ScheduledTask[] = []
  private _events: Map<string, AnyFunc> = new Map()
  private _messageFuncs: Map<MessageHandler, OicqMessageHandler | null> = new Map()
  private _cmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()
  private _adminCmdFuncs: Map<MessageCmdHandler, OicqMessageHandler | string | RegExp> = new Map()

  constructor(name: string) {
    super()
    this._name = name
  }

  private error(message: string) {
    throw new PluginError(this._name, message)
  }

  // 插件被框架挂载（启用）时被框架调用
  mount(bot: Client, admins: number[]) {
    // 插件监听 ociq 的所有事件
    OicqEvents.forEach((evt) => {
      const handler = (e: FirstParam<EventMap[typeof evt]>) => this.emit(evt, e, bot)

      // 插件收到事件时，将事件及数据转 emit 给插件里定义的处理函数
      bot.on(evt, handler)

      // this._event 保存所有监听函数的引用，在卸载时通过这个引用取消监听
      this._events.set(evt, handler)
    })

    // plugin.message() 添加进来的处理函数
    this._messageFuncs.forEach((_, handler) => {
      const oicqHandler = (e: MessageEvent) => handler(e, bot)
      bot.on('message', oicqHandler)
      this._messageFuncs.set(handler, oicqHandler)
    })

    // plugin.cmd() 添加进来的处理函数
    this._cmdFuncs.forEach((cmd, handler) => {
      const reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd as string}($|\\s+)`)

      const oicqHandler = (e: MessageEvent) => {
        if (reg.test(e.raw_message)) {
          const args = parseCommand(e.raw_message)
          handler(e, args, bot)
        }
      }

      bot.on('message', oicqHandler)

      this._cmdFuncs.set(handler, oicqHandler)
    })

    // plugin.adminCmd() 添加进来的处理函数
    this._adminCmdFuncs.forEach((cmd, handler) => {
      const reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd as string}($|\\s+)`)

      const oicqHandler = (e: MessageEvent) => {
        const isAdmin = admins.includes(e.sender.user_id)

        if (isAdmin && reg.test(e.raw_message)) {
          const args = parseCommand(e.raw_message)
          handler(e, args, bot)
        }
      }

      bot.on('message', oicqHandler)

      this._adminCmdFuncs.set(handler, oicqHandler)
    })
  }

  // 插件被取消挂载（禁用）时被框架调用
  unmount(bot: Client) {
    // 取消所有定时任务
    this._task.forEach((e) => e.stop())

    // 取消监听 oicq 的所有事件
    OicqEvents.forEach((evt) => {
      const handler = this._events.get(evt)!

      bot.off(evt, handler)
    })

    // plugin.message() plugin.admincCmd() 和 plugin.cmd() 添加进来的处理函数
    const funcs = [...this._messageFuncs, ...this._cmdFuncs, ...this._adminCmdFuncs]

    // 取出 oicq handlers
    const oicqHandlers = funcs.map((e) => e[1] as OicqMessageHandler)

    //  卸载时通过 oicq handlers 取消监听
    oicqHandlers.forEach((oicqHandler) => bot.off('message', oicqHandler))
  }

  cron(cronStr: string, func: (bot: Client, cronStr: string) => void, options?: ScheduleOptions) {
    const isCronValid = cron.validate(cronStr)

    if (!isCronValid) {
      this.error('Cron 表达式有误，请参考框架文档')
    }

    const handler = () => {
      if (this._bot) {
        func(this._bot as Client, cronStr)
      } else {
        this.error('Bot 实例未挂载')
      }
    }

    const task = cron.schedule(cronStr, handler, options)

    this._task.push(task)

    return task
  }

  message(hander: MessageHandler) {
    this._messageFuncs.set(hander, null)
  }

  cmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  adminCmd(cmd: string | RegExp, hander: MessageCmdHandler) {
    this._cmdFuncs.set(hander, cmd)
  }

  // set enableGroups(number: number[]) {}
}

const plugin = new Plugin('百度百科')

const task1 = plugin.cron('10:20', async (bot) => {})
const task2 = plugin.cron('10:20', (bot) => {})

task1.stop()

plugin.message(async (event, bot) => event.reply('Hello'))

plugin.cmd('你好', (event, args, bot) => event.reply('Hello'))

plugin.adminCmd('#开启本群', (event, args, bot) => {
  // 读写 plugins.enableGroups 会自动 persist data
  // if (event.message_type === 'group') {
  //   if (plugin.enableGroups.has(event.group_id)) {
  //     event.reply('当前群已经是开启状态')
  //   } else {
  //     plugin.enableGroups.add(event.group_id)
  //     event.reply('已开启')
  //   }
  // }
})

// plugin.on('message', (e, bot) => e.reply('Hello World'))
// plugin.on('system.', (e, bot) => e.reply('Hello World'))
