import { searchAllPlugins } from '@kivi-dev/shared'

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

  async parse(cmd: string, params: string[], options: Record<string, any>, client: KiviClient) {
    this.#params = params
    this.#options = options
    this.#kiviClient = client
    this.#config = client.KiviClientConfig

    const cmds = [['plugin', 'p'], ['status', 's'], ['config', 'c'], ['help', 'h'], 'about', 'exit']

    // 映射 alias 到 cmd
    cmds.forEach((alias) => {
      if (Array.isArray(alias) && alias.includes(cmd)) {
        alias[0] !== cmd && (cmd = alias[0])
      }
    })

    if (!cmds.flat().includes(cmd)) return

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

    const isMainAdmin = (qq?: number) => qq && this.#config?.botConfig?.admins?.includes(qq)

    if (!isMainAdmin(this.#event?.sender.user_id)) {
      return this.#event!.reply('〓 你没有权限 〓')
    }

    const [secondCmd, pname] = this.#params

    switch (secondCmd) {
      case 'list': {
        const ps = await searchAllPlugins(this.#config?.cwd)

        const isEnable = (name: string) => this.#config?.botConfig?.plugins?.includes(name)
        const infos = ps.map((p) => `${isEnable(p.name) ? '✅' : '❌'} ${p.name}`)

        this.#event?.reply(infos.length ? infos.join('\n') : '〓 没有插件 〓')
        break
      }

      case 'on': {
        if (!pname) {
          return this.#event!.reply('〓 请指定插件名称 〓')
        }

        const isEnable = (name: string) => this.#config?.botConfig?.plugins?.includes(name)

        if (isEnable(pname)) {
          return this.#event!.reply('〓 插件已启用 〓')
        }

        const ps = await searchAllPlugins(this.#config?.cwd)
        const plugin = ps.find((p) => p.name === pname)

        console.log(ps)

        if (!plugin) {
          return this.#event!.reply('〓 插件不存在 〓')
        }

        await this.#kiviClient?.enablePlugin(plugin)

        this.#config?.botConfig?.plugins?.push(pname)

        this.#event?.reply('〓 插件启用成功 〓')

        break
      }

      case 'off': {
        if (!pname) {
          return this.#event!.reply('〓 请指定插件名称 〓')
        }

        const isDisable = (name: string) => !this.#config?.botConfig?.plugins?.includes(name)

        if (!isDisable(pname)) {
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

      default:
        null
    }
  }

  status() {}

  config() {}

  help() {}

  about() {}

  exit() {}
}

export default new Command()
