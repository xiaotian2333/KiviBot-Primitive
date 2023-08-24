import { bot, defineCmdMap, defineMsgHandler } from '@kivi-dev/plugin'

import { config } from '.'
import { render } from './utils.js'

export const msgHandler = defineMsgHandler(async (ctx) => {
  const text = ctx.raw_message
  const isCmd = text.startsWith('.qa')

  const word = config.words.find(([key, _, mode]: string[]) => {
    const isFuzzy = mode === 'fuzzy' && text.includes(key)
    const isExact = mode === 'exact' && text === key
    const isRegExp = mode === 'regexp' && new RegExp(key).test(text)

    return isFuzzy || isExact || isRegExp
  })

  if (isCmd || !word) return

  const res = await render(word[1], bot(), ctx)

  if (res) {
    ctx.reply(res)
  }
})

export const cmdHandlersMap = defineCmdMap({
  default: (ctx) => ctx.reply('.qa <add|rm|ls|test>'),

  add(ctx, params, options) {
    const [key, value] = params

    if (!key || !value) {
      return ctx.reply('.qa add <关键词> <回复内容>')
    }

    const isWordExist = config.words.find(([k]) => k === key)

    if (isWordExist) {
      return ctx.reply('❌ 关键词已存在')
    }

    config.words.push([key, value, options.f ? 'fuzzy' : options.r ? 'regexp' : 'exact'])

    ctx.reply('✅ 添加成功')
  },

  rm(ctx, params) {
    const [key] = params

    if (!key) {
      return ctx.reply('.qa rm <关键词>')
    }

    const index = config.words.findIndex(([k]) => k === key)

    if (index === -1) {
      return ctx.reply('❌ 关键词不存在')
    }

    config.words.splice(index, 1)

    ctx.reply('✅ 删除成功')
  },

  ls(ctx) {
    const isEmpty = config.words.length === 0

    if (isEmpty) {
      return ctx.reply('关键词列表为空')
    }

    ctx.reply(config.words.map(([key, value, mode]) => `${key} -> ${value} [${mode}]`).join('\n'))
  },

  async test(ctx, params) {
    const [key] = params

    if (!key) {
      return ctx.reply('.qa test <关键词>')
    }

    const word = config.words.find(([k]) => k === key)

    if (!word) {
      return ctx.reply('❌ 关键词不存在')
    }

    const res = await render(word[1], bot(), ctx)

    if (res) {
      ctx.reply(res)
    }
  },

  chmod(ctx, params) {
    const [key, mode] = params

    if (!key || !mode) {
      return ctx.reply('.qa chmod <关键词> <模式>')
    }

    const word = config.words.find(([k]) => k === key)

    if (!word) {
      return ctx.reply('❌ 关键词不存在')
    }

    word[2] = mode

    ctx.reply('✅ 修改成功')
  },
})
