import { b, escapeColor, searchAllPlugins, stringifyError } from '@kivi-dev/shared'
import { segment } from 'icqq'

import { fetchStatus } from './status.js'

import type KiviClient from './kivi-client.js'
import type { Logger } from './logger.js'
import type { AllMessageEvent, BotConfig, ClientWithApis } from '@kivi-dev/types'

class Command {
  #event?: AllMessageEvent
  #params: string[] = []
  #options: Record<string, any> = {}
  #kiviClient?: KiviClient
  #config?: {
    botConfig: BotConfig | undefined
    cwd: string
    bot: ClientWithApis | undefined
    mainLogger: Logger
    loggers: Map<string, Logger>
  }

  bindEvent(event: AllMessageEvent) {
    this.#event = event
  }

  isPluginEnable(pluginName: string) {
    return this.#kiviClient?.plugins?.get(pluginName)
  }

  async parse(cmd: string, params: string[], options: Record<string, any>, client: KiviClient) {
    this.#params = params
    this.#options = options
    this.#kiviClient = client
    this.#config = client.KiviClientConfig

    const cmds = [
      ['plugin', 'p'],
      ['status', 's'],
      ['help', 'h'],
      ['about', 'a'],
      ['exit', 'e'],
    ]

    // 映射 alias 到 cmd
    cmds.forEach((alias) => {
      if (Array.isArray(alias) && alias.includes(cmd)) {
        alias[0] !== cmd && (cmd = alias[0])
      }
    })

    if (!cmds.flat(2).includes(cmd)) return

    // @ts-expect-error fix me
    const res = this[cmd]()

    if (res instanceof Promise) await res
  }

  async plugin() {
    if (!this.#params.length) {
      const infos = [
        '〓 Kivi 插件命令 〓',
        '.p list',
        '.p on/off <name?> [-aw]',
        '.p reload <name>',
      ]

      this.#event!.reply(infos.join('\n'))
      return
    }

    const isMainAdmin = (qq?: number) => {
      return qq && this.#config?.botConfig?.admins[0] === qq
    }

    if (!isMainAdmin(this.#event?.sender.user_id)) {
      this.#event!.reply('〓 权限不足 〓')
      return
    }

    const [secondCmd, pname] = this.#params

    switch (secondCmd) {
      case 'ls':
      case 'list': {
        const ps = await searchAllPlugins(this.#config?.cwd)
        const infos = ps.map((p) => `${this.isPluginEnable(p.name) ? '●' : '○'} ${p.name}`)
        const enableCount = ps.filter((p) => this.isPluginEnable(p.name)).length

        const message = [
          '〓 Kivi 插件列表 〓',
          infos.join('\n'),
          `共 ${infos.length} 个，启用 ${enableCount} 个`,
        ]

        this.#event?.reply(infos.length ? message.join('\n') : '〓 本地没有插件 〓')
        break
      }

      case 'on': {
        if (!pname) {
          this.#event!.reply('〓 请指定插件名称 〓')
          return
        }

        if (this.isPluginEnable(pname)) {
          this.#event!.reply('〓 插件已启用 〓')
          return
        }

        const ps = await searchAllPlugins(this.#config?.cwd)
        const plugin = ps.find((p) => p.name === pname)

        if (!plugin) {
          this.#event!.reply('〓 插件不存在 〓')
          return
        }

        try {
          await this.#kiviClient?.enablePlugin(plugin)
          this.#config?.botConfig?.plugins?.push(pname)

          this.#event?.reply('〓 插件启用成功 〓')
        } catch (e: any) {
          const err = e?.message || JSON.stringify(e)
          this.#event!.reply('〓 插件启用失败 〓\n报错信息如下: ' + escapeColor(err))
        }

        break
      }

      case 'off': {
        if (!pname) {
          this.#event!.reply('〓 请指定插件名称 〓')
          return
        }

        if (!this.isPluginEnable(pname)) {
          this.#event!.reply('〓 插件未启用 〓')
          return
        }

        try {
          await this.#kiviClient?.disablePlugin(pname)
          const idx = this.#config?.botConfig?.plugins?.indexOf(pname)
          this.#config?.botConfig?.plugins?.splice(Number(idx), 1)
          this.#event!.reply('〓 插件已禁用 〓')
        } catch (e: any) {
          const err = e?.message || JSON.stringify(e)
          this.#event!.reply('〓 插件禁用失败 〓\n报错信息如下: ' + escapeColor(err))
        }

        break
      }

      case 'reload':
      case 'rl': {
        if (!pname) {
          this.#event!.reply('〓 请指定插件名称 〓')
          return
        }

        try {
          await this.#kiviClient?.reloadPlugin(pname)

          this.#event!.reply('〓 重载成功 〓')
        } catch (e: any) {
          const err = e?.message || JSON.stringify(e)

          const idx = this.#config?.botConfig?.plugins?.indexOf(pname)
          this.#config?.botConfig?.plugins?.splice(Number(idx), 1)

          this.#event!.reply('〓 插件重载失败 〓\n报错信息如下: ' + escapeColor(err))
        }

        break
      }
    }
  }

  async status() {
    const bot = this.#kiviClient?.bot as ClientWithApis

    try {
      const status = await fetchStatus(bot, this.#config?.botConfig)
      const res = await this.#kiviClient?.bot?.apis?.renderStatus?.(status)

      this.#event?.reply(res ? segment.image(res) : status)
    } catch (e) {
      this.#event?.reply('〓 获取状态发生错误 〓\n错误信息：' + stringifyError(e))
    }
  }

  async config() {}

  help() {
    const infos = [
      '〓 Kivi 帮助 〓',
      '.p 插件操作',
      '.s 框架状态',
      '.h 显示帮助',
      '.a 关于框架',
      '.e 退出进程',
    ]

    this.#event!.reply(infos.join('\n'))
  }

  about() {
    const infos = [
      '〓 关于 Kivi 〓\n',
      'Kivi 是一个基于 oicq/icqq 与 Node.js 的机器人框架，使用 TypeScript 语言编写。',
      '开源地址：https://github.com/vikiboss/kivibot',
    ]

    this.#event!.reply(infos.join(''))
  }

  async exit() {
    const isMainAdmin = (qq?: number) => {
      return qq && this.#config?.botConfig?.admins[0] === qq
    }

    if (!isMainAdmin(this.#event?.sender.user_id)) {
      this.#event!.reply('〓 权限不足 〓')
      return
    }

    await this.#event!.reply('〓 进程已停止 〓')

    this.#config?.mainLogger.fatal(b('Kivi 已由管理员通过消息指令退出'))
    process.exit(0)
  }
}

export default new Command()
