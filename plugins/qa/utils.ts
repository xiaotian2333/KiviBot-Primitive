import {
  axios,
  md5,
  segment,
  dayjs,
  randomInt,
  randomItem,
  getQQAvatarLink,
} from '@kivi-dev/plugin'
import mustache from 'mustacheee'
import os from 'node:os'

import type { GroupMessageEvent } from '@kivi-dev/plugin'
import type { AllMessageEvent, ClientWithApis } from '@kivi-dev/types'
import type { RenderFunction, View } from 'mustacheee'

const DELIMITER = '__ELEMENT__DELIMITER__'

export async function render(template: string, bot: ClientWithApis, ctx: AllMessageEvent) {
  const view = generateViewMap(bot, ctx)
  return processString(await mustache.render(template, view, {}, ['[', ']']))
}

function processString(template: string) {
  return (
    template
      .split(DELIMITER)
      .filter((e) => Boolean(e.trim()))
      // 将 json 字符串解析成 oicq/icqq 可以识别的 element js 对象，比如 QQ 表情、图片
      .map((e) => (/"type":"/.test(e) ? JSON.parse(e) : e))
  )
}

function generateViewMap(bot: ClientWithApis, ctx: AllMessageEvent): View {
  const wrapFn = (fn: RenderFunction) => () => fn

  const wrapDelimiter = (value: string | Record<string, any>) => {
    if (typeof value === 'object') {
      value = JSON.stringify(value)
    }

    return DELIMITER + value + DELIMITER
  }

  return {
    at_all: wrapDelimiter(segment.at('all')),

    // t is text, and r is render
    face: wrapFn(async (t, r) => wrapDelimiter(segment.face(Number(await r(t))))),
    image: wrapFn(async (t, r) => wrapDelimiter(segment.image(await r(t)))),
    record: wrapFn(async (t, r) => wrapDelimiter(segment.record(await r(t)))),
    rps: wrapFn(async (t, r) => wrapDelimiter(segment.rps(Number(await r(t))))),
    dice: wrapFn(async (t, r) => wrapDelimiter(segment.dice(Number(await r(t))))),
    poke: wrapFn(async (t, r) => wrapDelimiter(segment.poke(Number(await r(t))))),

    at: wrapFn(async (text, render) => {
      const [qq, _text, dummy] = (await render(text)).split(',')
      return wrapDelimiter(segment.at(qq, _text, dummy === 'true'))
    }),

    bface: wrapFn(async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return wrapDelimiter(segment.bface(file, _text))
    }),

    sface: wrapFn(async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return wrapDelimiter(segment.bface(file, _text))
    }),

    n: wrapFn(async (text, render) => {
      const [min, max] = (await render(text)).split(',').map(Number)
      return randomInt(min, max ?? min)
    }),

    br: '\n',
    bn: bot.nickname,
    bqq: bot.uin,
    arch: os.arch(),
    sqq: ctx.sender.user_id,
    gid: (ctx as GroupMessageEvent)?.group_id,
    timestamp: Date.now(),
    t: wrapFn(async (t, r) => dayjs(new Date()).format(await r(t))),
    time: wrapFn(async (t, r) => dayjs(new Date()).format(await r(t))),
    md5: wrapFn(async (t, r) => md5(await r(t), 'hex') as string),

    rgu: async () => {
      const map = await (ctx as GroupMessageEvent)?.group.getMemberMap()
      const memberIds = [...map.values()].map((e) => e.user_id)
      return randomItem(memberIds)!
    },

    av: wrapFn(async (t, r) => wrapDelimiter(getQQAvatarLink(Number(await r(t)), 640, true))),

    get: wrapFn(async (text, render) => {
      const renderedText = await render(text)
      const { data } = await axios.get(renderedText)

      if (typeof data === 'string') return data

      return JSON.stringify(data, null, 2)
    }),

    post: wrapFn(async (text, render) => {
      const renderedText = await render(text)
      const { data } = await axios.post(renderedText)

      if (typeof data === 'string') return data

      return JSON.stringify(data, null, 2)
    }),
  }
}
