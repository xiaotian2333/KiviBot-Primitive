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
import type { View } from 'mustacheee/lib/types.js'

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
  function generateSegment<
    K extends Exclude<keyof typeof segment, 'text' | 'toCqcode' | 'fromCqcode'>,
  >(key: K, ...params: Parameters<(typeof segment)[K]>) {
    return () => async (text, render) => {
      return (
        DELIMITER + JSON.stringify(segment[key](Number(await render(text)), ...params)) + DELIMITER
      )
    }
  }

  return {
    at_all: DELIMITER + JSON.stringify(segment.at('all')) + DELIMITER,
    face: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.face(Number(await render(text)))) + DELIMITER
    },
    image: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.image(await render(text))) + DELIMITER
    },
    record: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.record(await render(text))) + DELIMITER
    },
    rps: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.rps(Number(await render(text)))) + DELIMITER
    },
    dice: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.dice(Number(await render(text)))) + DELIMITER
    },
    poke: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.poke(Number(await render(text)))) + DELIMITER
    },
    at: () => async (text, render) => {
      const [qq, _text, dummy] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.at(qq, _text, dummy === 'true')) + DELIMITER
    },
    bface: () => async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text)) + DELIMITER
    },
    sface: () => async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text)) + DELIMITER
    },
    n: () => async (text, render) => {
      const [min, max] = (await render(text)).split(',').map(Number)
      return randomInt(min, max)
    },
    br: '\n',
    bqq: bot.uin,
    sqq: ctx.sender.user_id,
    gid: (ctx as GroupMessageEvent)?.group_id,
    rgu: async () => {
      const map = await (ctx as GroupMessageEvent)?.group.getMemberMap()
      const memberIds = [...map.values()].map((e) => e.user_id)
      return randomItem(memberIds)!
    },
    av: () => async (text, render) => {
      return (
        DELIMITER +
        JSON.stringify(getQQAvatarLink(Number(await render(text)), 640, true)) +
        DELIMITER
      )
    },
    timestamp: Date.now(),
    t: () => async (text, render) => dayjs(new Date()).format(await render(text)),
    time: () => async (text, render) => dayjs(new Date()).format(await render(text)),
    arch: os.arch(),
    bn: () => bot.nickname,
    get: () => async (text, render) => {
      const renderedText = await render(text)
      const { data } = await axios.get(renderedText)

      if (typeof data === 'string') return data

      return JSON.stringify(data, null, 2)
    },
    post: () => async (text, render) => {
      const renderedText = await render(text)
      const { data } = await axios.post(renderedText)

      if (typeof data === 'string') return data

      return JSON.stringify(data, null, 2)
    },
    md5: () => async (text, render) => md5(await render(text), 'hex') as string,
  }
}
