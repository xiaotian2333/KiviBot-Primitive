import {
  axios,
  md5,
  segment,
  dayjs,
  randomInt,
  randomItem,
  getQQAvatarLink,
} from '@kivi-dev/plugin'
import mustache from 'mustache'
import os from 'node:os'

import type { GroupMessageEvent } from '@kivi-dev/plugin'
import type { AllMessageEvent, ClientWithApis } from '@kivi-dev/types'

type Res = string | number

interface View {
  [attr: string]:
    | Res
    | (() => Res | Promise<Res>)
    | (() => (text: string, render: (text: string) => string) => Res | Promise<Res>)
}

const DELIMITER = '__ELEMENT__DELIMITER__'

export async function render(template: string, bot: ClientWithApis, ctx: AllMessageEvent) {
  return processString(mustache.render(template, await fetchVariables(bot, ctx), {}, ['[', ']']))
}

function processString(template: string) {
  return template.split(DELIMITER).map((e) => {
    return typeof e === 'string' ? e : JSON.parse(e)
  })
}

function fetchVariables(bot: ClientWithApis, ctx: AllMessageEvent): View {
  return {
    at_all: DELIMITER + JSON.stringify(segment.at('all')),
    face: () => (text, render) => DELIMITER + JSON.stringify(segment.face(Number(render(text)))),
    image: () => (text, render) => DELIMITER + JSON.stringify(segment.image(render(text))),
    record: () => (text, render) => DELIMITER + JSON.stringify(segment.record(render(text))),
    rps: () => (text, render) => DELIMITER + JSON.stringify(segment.rps(Number(render(text)))),
    dice: () => (text, render) => DELIMITER + JSON.stringify(segment.dice(Number(render(text)))),
    poke: () => (text, render) => DELIMITER + JSON.stringify(segment.poke(Number(render(text)))),
    at: () => (text, render) => {
      const [qq, _text, dummy] = render(text).split(',')
      return DELIMITER + JSON.stringify(segment.at(qq, _text, dummy === 'true'))
    },
    bface: () => (text, render) => {
      const [file, _text] = render(text).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text))
    },
    sface: () => (text, render) => {
      const [file, _text] = render(text).split(',')
      return DELIMITER + JSON.stringify(segment.bface(file, _text))
    },
    n: () => (text, render) => {
      const [min, max] = render(text).split(',').map(Number)
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
    av: () => (text, render) =>
      DELIMITER + JSON.stringify(getQQAvatarLink(Number(render(text)), 640, true)),
    timestamp: Date.now(),
    t: () => (text, render) => dayjs(new Date()).format(render(text)),
    time: () => (text, render) => dayjs(new Date()).format(render(text)),
    arch: os.arch(),
    bn: () => bot.nickname,
    get: () => async (text, render) => (await axios.get(render(text))).data,
    post: () => async (text, render) => (await axios.post(render(text))).data,
    md5: () => (text, render) => md5(render(text), 'hex') as string,
  }
}
