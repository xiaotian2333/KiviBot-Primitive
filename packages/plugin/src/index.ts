import type { AnyFunc } from '@kivi-dev/types'
import type { Client } from 'icqq'

class Plugin {
  #enabled = false
  bot?: Client
  #enableListener: AnyFunc[] = []

  init(bot: Client) {
    this.bot = bot
  }

  setup() {}

  useEnable() {
    this.#enabled = true
  }

  useConfig() {
    return this.#enabled
  }
}

const plugin = new Plugin()

export const bot = plugin.bot
export const useEnable = () => plugin.useEnable()
export const useConfig = () => plugin.useConfig()

export { plugin }
