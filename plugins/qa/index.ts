import { useCmd, bot, setup, useConfig, useMessage, useMount } from '@kivi-dev/plugin'

import { render } from './utils'

setup('关键词', '1.0.0')

useMount(() => {
  const config = useConfig<{ words: string[][] }>({ words: [] })

  useCmd('.qa', {
    add(ctx, params, options) {
      const [key, value] = params

      if (!key || value) return ctx.reply('.qa add <关键词> <回复内容>')

      config.words.push([key, value, options.f ? 'fuzzy' : 'exact'])

      ctx.reply('添加成功')
    },
  })

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
