import { useCmd, bot, setup, useConfig, useMessage, useMount } from '@kivi-dev/plugin'

import cmdHandlerMap from './cmd.js'
import { render } from './utils.js'

setup('关键词', '1.0.0')

export const config = useConfig<{ words: string[][] }>({ words: [] })

useMount(() => {
  useCmd(['.qa', 'qa'], cmdHandlerMap)

  useMessage(async (ctx) => {
    const text = ctx.raw_message
    const isCmd = text.startsWith('.qa')

    const word = config.words?.find(([key, _, mode]: string[]) => {
      return mode === 'fuzzy' ? text.includes(key) : text === key
    })

    if (isCmd || !word) return

    const res = await render(word[1], bot(), ctx)

    if (res) {
      ctx.reply(res)
    }
  })
})

export { plugin } from '@kivi-dev/plugin'
