import type { AnyFunc } from '@kivi-dev/types'
import type { Client } from 'icqq'

class Plugin {
  bot?: Client
  #enableListener: AnyFunc[] = []

  init(bot: Client) {
    this.bot = bot
  }

  setup() {}
  useEnable() {}
  useConfig() {}
}

const plugin = new Plugin()

export const bot = plugin.bot
export const useMount = () => plugin.useEnable()
export const useConfig = () => plugin.useConfig()

export { plugin }
