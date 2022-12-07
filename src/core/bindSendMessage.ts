import { KiviLogger } from './logger'
import { colors } from '@src/utils'

import type { Anonymous, Client, Quotable, Sendable } from 'oicq'

export const MessagCounts = {
  value: 0
}

export async function bindSendMessage(bot: Client) {
  bot.gl.forEach(({ group_id, group_name = 'unknown' }) => {
    const group = bot.pickGroup(group_id)
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [G:${group_id}(${group_name})]`

    group.sendMsg = async (
      content: Sendable,
      source?: Quotable | undefined,
      anony?: boolean | Omit<Anonymous, 'flag'> | undefined
    ) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source, anony)
    }
  })

  bot.fl.forEach(({ user_id, nickname = 'unknown' }) => {
    const friend = bot.pickFriend(user_id)
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [P:${user_id}(${nickname})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source)
    }
  })

  bot.on('notice.group.increase', ({ group }) => {
    const { group_id, name = 'unknown' } = group
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [G:${group_id}(${name})]`

    group.sendMsg = async (
      content: Sendable,
      source?: Quotable | undefined,
      anony?: boolean | Omit<Anonymous, 'flag'> | undefined
    ) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source, anony)
    }
  })

  bot.on('notice.friend.increase', ({ friend }) => {
    const { user_id, nickname = 'unknown' } = friend
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [P:${user_id}(${nickname})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source)
    }
  })
}
