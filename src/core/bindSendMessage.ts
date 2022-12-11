import { colors } from '@src/utils'
import { KiviLogger } from './logger'

import type { Anonymous, Client, Quotable, Sendable } from 'oicq'

/** 记录已发送的消息数 */
export const MessagCounts = {
  value: 0
}

/** bind flag，防止掉线重新上线触发 online 事件时重复 bind */
let hasBind = false

/** 重写消息发送函数，记录发送消息数并打印日志 */
export async function bindSendMessage(bot: Client) {
  if (hasBind) {
    return
  }

  hasBind = true

  bot.gl.forEach(({ group_id, group_name = '未知' }) => {
    const group = bot.pickGroup(group_id)
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [群:${group_id}(${group_name})]`

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

  bot.fl.forEach(({ user_id, nickname = '未知' }) => {
    const friend = bot.pickFriend(user_id)
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [私:${user_id}(${nickname})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source)
    }
  })

  bot.on('notice.group.increase', ({ group }) => {
    const { group_id, name = '未知' } = group
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [群:${group_id}(${name})]`

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
    const { user_id, nickname = '未知' } = friend
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [私:${user_id}(${nickname})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${content.toString()}`))

      // 已发送消息计数
      MessagCounts.value++

      return sendMsg(content, source)
    }
  })
}
