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
  return processString(await mustache.render(template, fetchVariables(bot, ctx), {}, ['[', ']']))
}

function processString(template: string) {
  return template.split(DELIMITER).map((e) => {
    return typeof e === 'string' ? e : JSON.parse(e)
  })
}

function fetchVariables(bot: ClientWithApis, ctx: AllMessageEvent): View {
  return {
    at_all: DELIMITER + JSON.stringify(segment.at('all')),
    face: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.face(Number(await render(text))))
    },
    image: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.image(await render(text)))
    },
    record: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.record(await render(text)))
    },
    rps: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.rps(Number(await render(text))))
    },
    dice: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.dice(Number(await render(text))))
    },
    poke: () => async (text, render) => {
      return DELIMITER + JSON.stringify(segment.poke(Number(await render(text))))
    },
    at: () => async (text, render) => {
      const [qq, _text, dummy] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.at(qq, _text, dummy === 'true'))
    },
    bface: () => async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text))
    },
    sface: () => async (text, render) => {
      const [file, _text] = (await render(text)).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text))
    },
    n: () => async (text, render) => {
      const [min, max] = (await render(text)).split(',').map(Number)
      return randomInt(min, max)
    },
    rpl: DELIMITER + JSON.stringify('rpl'),
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
      return DELIMITER + JSON.stringify(getQQAvatarLink(Number(await render(text)), 640, true))
    },
    timestamp: Date.now(),
    t: () => async (text, render) => dayjs(new Date()).format(await render(text)),
    time: () => async (text, render) => dayjs(new Date()).format(await render(text)),
    arch: os.arch(),
    bn: () => bot.nickname,
    get: () => async (text, render) => (await axios.get(await render(text))).data,
    post: () => async (text, render) => (await axios.post(await render(text))).data,
    md5: () => async (text, render) => md5(await render(text), 'hex') as string,
  }
}
