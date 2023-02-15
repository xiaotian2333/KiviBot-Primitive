import { KeliLogger } from '@/src'
import { colors, ensureArray } from '@/utils'

import type { Client, Friend, Group, MessageElem, MessageRet, Quotable, Sendable } from 'movo'

export type SendFunc = (content: Sendable, source?: Quotable | undefined) => Promise<MessageRet>

/** 重写消息发送函数，打印发送消息的日志 */
export async function bindSendMessage(bot: Client) {
  for (const [gid, { group_name = '未知' }] of bot.gl) {
    const group = bot.pickGroup(gid)
    const head = `↑ [群:${group_name}(${gid})]`
    bindSend(group, head)
  }

  for (const [qq, { nickname = '未知' }] of bot.fl) {
    const friend = bot.pickFriend(qq)
    const head = `↑ [私:${nickname}(${qq})]`
    bindSend(friend, head)
  }

  bot.on('notice.group.increase', ({ group, user_id }) => {
    if (user_id !== bot.uin) return
    const { group_id, name = '未知' } = group
    const head = `↑ [群:${name}(${group_id})]`
    bindSend(group, head)
  })

  bot.on('notice.friend.increase', ({ friend }) => {
    const { user_id, nickname = '未知' } = friend
    const head = `↑ [私:${nickname}(${user_id})]`
    bindSend(friend, head)
  })
}

export function showKeliLog(head: string, content: Sendable) {
  return KeliLogger.info(colors.gray(`${head} ${stringifySendable(content)}`))
}

export function stringifySendable(content: Sendable) {
  return ensureArray(content).map(stringifyMessageItem).join('')
}

export function stringifyMessageItem(content: string | MessageElem) {
  if (typeof content === 'string') {
    return content
  } else {
    return JSON.stringify(content)
  }
}

function bindSend(target: Group | Friend, head: string) {
  const sendMsg = target.sendMsg.bind(target)

  target.sendMsg = async function (content: Sendable, source?: Quotable | undefined) {
    showKeliLog(head, content)

    return sendMsg(content, source)
  }
}
