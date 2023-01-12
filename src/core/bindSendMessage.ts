import { KiviLogger } from '@/src'
import { colors } from '@/src/utils'

import type { Anonymous, Client, MessageElem, Quotable, Sendable } from 'oicq'

/** 记录已发送的消息数 */
export const MessageCounts = {
  value: 0
}

/** 重写消息发送函数，记录发送消息数并打印日志 */
export async function bindSendMessage(bot: Client) {
  bot.gl.forEach(({ group_id, group_name = '未知' }) => {
    const group = bot.pickGroup(group_id)
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [群:${group_name}(${group_id})]`

    group.sendMsg = async (
      content: Sendable,
      source?: Quotable | undefined,
      anony?: boolean | Omit<Anonymous, 'flag'> | undefined
    ) => {
      KiviLogger.info(colors.gray(`${head} ${stringifySendable(content)}`))

      // 已发送消息计数
      MessageCounts.value++

      return sendMsg(content, source, anony)
    }
  })

  bot.fl.forEach(({ user_id, nickname = '未知' }) => {
    const friend = bot.pickFriend(user_id)
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [私:${nickname}(${user_id})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${stringifySendable(content)}`))

      // 已发送消息计数
      MessageCounts.value++

      return sendMsg(content, source)
    }
  })

  bot.on('notice.group.increase', ({ group, user_id }) => {
    if (user_id !== bot.uin) {
      return
    }

    const { group_id, name = '未知' } = group
    const sendMsg = group.sendMsg.bind(group)
    const head = `↑ [群:${name}(${group_id})]`

    group.sendMsg = async (
      content: Sendable,
      source?: Quotable | undefined,
      anony?: boolean | Omit<Anonymous, 'flag'> | undefined
    ) => {
      KiviLogger.info(colors.gray(`${head} ${stringifySendable(content)}`))

      // 已发送消息计数
      MessageCounts.value++

      return sendMsg(content, source, anony)
    }
  })

  bot.on('notice.friend.increase', ({ friend }) => {
    const { user_id, nickname = '未知' } = friend
    const sendMsg = friend.sendMsg.bind(friend)
    const head = `↑ [私:${nickname}(${user_id})]`

    friend.sendMsg = async (content: Sendable, source?: Quotable | undefined) => {
      KiviLogger.info(colors.gray(`${head} ${stringifySendable(content)}`))

      // 已发送消息计数
      MessageCounts.value++

      return sendMsg(content, source)
    }
  })
}

function stringifySendable(content: Sendable) {
  if (Array.isArray(content)) {
    return content.map(stringifyMessageItem).join('')
  }

  return stringifyMessageItem(content)
}

function stringifyMessageItem(content: string | MessageElem) {
  if (typeof content === 'string') {
    return content
  } else {
    return JSON.stringify(content)
  }
}
