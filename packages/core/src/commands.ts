import { searchAllPlugins } from '@kivi-dev/shared'

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
      ['config', 'conf', 'c'],
      ['help', 'h'],
      'about',
      'exit',
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

      return this.#event!.reply(infos.join('\n'))
    }

    const isMainAdmin = (qq?: number) => {
      return qq && this.#config?.botConfig?.admins[0] === qq
    }

    if (!isMainAdmin(this.#event?.sender.user_id)) {
      return this.#event!.reply('〓 你没有权限 〓')
    }

    const [secondCmd, pname] = this.#params

    switch (secondCmd) {
      case 'list': {
        const ps = await searchAllPlugins(this.#config?.cwd)

        const infos = ps.map((p) => `${this.isPluginEnable(p.name) ? '✅' : '❌'} ${p.name}`)

        this.#event?.reply(infos.length ? infos.join('\n') : '〓 没有插件 〓')
        break
      }

      case 'on': {
        if (!pname) {
          return this.#event!.reply('〓 请指定插件名称 〓')
        }

        if (this.isPluginEnable(pname)) {
          return this.#event!.reply('〓 插件已启用 〓')
        }

        const ps = await searchAllPlugins(this.#config?.cwd)
        const plugin = ps.find((p) => p.name === pname)

        if (!plugin) {
          return this.#event!.reply('〓 插件不存在 〓')
        }

        const isOK = await this.#kiviClient?.enablePlugin(plugin)

        if (!isOK) {
          return this.#event!.reply('〓 插件启用失败 〓')
        }

        this.#config?.botConfig?.plugins?.push(pname)

        this.#event?.reply('〓 插件启用成功 〓')

        break
      }

      case 'off': {
        if (!pname) {
          return this.#event!.reply('〓 请指定插件名称 〓')
        }

        if (!this.isPluginEnable(pname)) {
          return this.#event!.reply('〓 插件未启用 〓')
        }

        const isOK = await this.#kiviClient?.disablePlugin(pname)

        if (!isOK) {
          return this.#event!.reply('〓 插件禁用失败 〓')
        } else {
          const idx = this.#config?.botConfig?.plugins?.indexOf(pname)
          this.#config?.botConfig?.plugins?.splice(Number(idx), 1)
        }

        this.#event!.reply('〓 插件已禁用 〓')

        break
      }

      case 'reload':
      case 'rl': {
        if (!pname) {
          return this.#event!.reply('〓 请指定插件名称 〓')
        }

        const isOK = await this.#kiviClient?.reloadPlugin(pname)

        if (!isOK) {
          return this.#event!.reply('〓 插件重载失败 〓')
        }

        this.#event!.reply('〓 重载成功 〓')

        break
      }
    }
  }

  async status() {
    const bot = this.#kiviClient?.bot as ClientWithApis
    const status = await fetchStatus(bot)

    return this.#event!.reply(status)
  }

  async config() {}

  help() {}

  about() {}

  async exit() {}
}

export default new Command()
