import type { Client, EventMap } from 'movo'

import { KeliLogger } from '@/core'
import { colors } from '@/utils'

/** 监听处理所有通知，打印框架日志 */
export function noticeHandler(
  this: Client,
  event: Parameters<EventMap['notice.friend']>[0] | Parameters<EventMap['notice.group']>[0]
) {
  const { user_id, sub_type } = event

  let message = ''

  if (event.notice_type === 'friend') {
    // 好友通知

    if (sub_type === 'decrease') {
      // 好友减少
      message = `- [Friend Decrease:${event.nickname}(${user_id})]`
    } else if (sub_type === 'increase') {
      // 好友增加
      message = `+ [Friend Increase:${event.nickname}(${user_id})]`
    } else if (sub_type === 'poke') {
      // 好友戳一戳
      const { target_id, operator_id, friend } = event

      const isOperatorSelf = operator_id === this.uin
      const isTargetSelf = target_id === this.uin
      const arrow = isOperatorSelf ? '↑' : '↓'

      // 触发方
      const operator = isOperatorSelf
        ? `${this.nickname}(${this.uin})`
        : `${friend.nickname || 'unknown'}(${friend.user_id})`

      // 被戳方
      const target = isTargetSelf
        ? `${this.nickname}(${this.uin})`
        : `${friend.nickname || 'unknown'}(${friend.user_id})`

      message = `${arrow} [Private Poke:${operator}->${target}]`
    } else if (sub_type === 'recall') {
      // 私聊撤回
      const { friend, operator_id, message_id } = event

      const isOperatorSelf = operator_id === this.uin
      const arrow = isOperatorSelf ? '↑' : '↓'
      const friendInfo = `${friend.nickname || 'unknown'}(${friend.user_id})`

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : friendInfo

      message = `${arrow} [Private Recall:${friendInfo}] [${operator}:${message_id}]`
    }
  } else if (event.notice_type === 'group') {
    // 群通知
    const groupInfo = `${event.group.name}(${event.group.gid})`

    if (sub_type === 'admin') {
      // 群管理变动
      const { set } = event

      if (set) {
        message = `+ [New Group Admin:${groupInfo}-${user_id}]`
      } else {
        message = `- [Cancel Group Admin:${groupInfo}-${user_id}]`
      }
    } else if (sub_type === 'ban') {
      // 群禁言
      const { duration, operator_id } = event

      const isBan = duration !== 0
      const label = isBan ? '+ [Ban' : '- [Unban'
      const desc = `${groupInfo}-${operator_id}->${user_id}${isBan ? `-${duration}分钟` : ''}`

      message = `${label}:${desc}]`
    } else if (sub_type === 'decrease') {
      // 群人数减少
      const { operator_id } = event
      message = `- [Leave Group:${groupInfo}-${operator_id || 'Initiative'}->${user_id}]`
    } else if (sub_type === 'increase') {
      // 群人数增加
      message = `+ [New Group Member:${groupInfo}-${user_id}]`
    } else if (sub_type === 'poke') {
      // 群戳一戳
      const { target_id, operator_id } = event

      const isOperatorSelf = operator_id === this.uin
      const isTargetSelf = target_id === this.uin
      const arrow = isOperatorSelf ? '↑' : '↓'

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id

      // 被戳方
      const target = isTargetSelf ? `${this.nickname}(${this.uin})` : target_id

      message = `${arrow} [Group Poke:${groupInfo}-${operator}->${target}]`
    } else if (sub_type === 'recall') {
      // 群聊撤回
      const { operator_id, message_id } = event
      const isOperatorSelf = operator_id === this.uin

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id
      const arrow = isOperatorSelf ? '↑' : '↓'

      message = `${arrow} [Group Recall:${groupInfo}-${operator_id}] [${operator}:${message_id}]`
    } else if (sub_type === 'transfer') {
      // 群聊转让
      const { operator_id } = event

      const isOperatorSelf = operator_id === this.uin
      const arrow = isOperatorSelf ? '↑' : '↓'

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id

      message = `${arrow} [Group transfer:${groupInfo}] [${operator}->${user_id}]`
    }
  }

  KeliLogger.info(colors.gray(message))
}
