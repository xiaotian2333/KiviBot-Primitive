import type { AllMessageEvent } from '@kivi-dev/types'

class Command {
  #event?: AllMessageEvent
  #params: string[] = []
  #options: Record<string, any> = {}
  #isMainAdmin = false

  bindEvent(event: AllMessageEvent) {
    this.#event = event
  }

  parse(cmd: string, params: string[], options: Record<string, any>, isMainAdmin: boolean) {
    this.#params = params
    this.#options = options

    const cmds = [['plugin', 'p'], ['status', 's'], ['config', 'c'], ['help', 'h'], 'about', 'exit']

    // 映射 alias 到 cmd
    cmds.forEach((alias) => {
      if (Array.isArray(alias) && alias.includes(cmd)) {
        alias[0] !== cmd && (cmd = alias[0])
      }
    })

    if (!cmds.flat().includes(cmd)) return

    // @ts-expect-error fix me
    this[cmd]()
  }

  plugin() {
    if (!this.#params.length) {
      const infos = [
        '〓 Kivi 插件命令 〓',
        '.p list',
        '.p on/off <name?> [-aw]',
        '.p reload <name>',
      ]

      return this.#event!.reply(infos.join('\n'))
    }

    if (!this.#isMainAdmin) {
      return this.#event!.reply('〓 你没有权限 〓')
    }

    const [secondCmd, pname] = this.#params

    switch (secondCmd) {
      case 'list': {
        //
        break
      }
      default:
        null
    }

    return this.#event!.reply(JSON.stringify({ params: this.#params, options: this.#options }))
  }

  status() {}

  config() {}

  help() {}

  about() {}

  exit() {}
}

export default new Command()
