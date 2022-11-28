import { KiviLogger } from '@/logger'
import { colors } from '@src/utils'

import type { Client, EventMap } from 'oicq'

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
      message = `- [friend decrease:${event.nickname}(${user_id})]`
    } else if (sub_type === 'increase') {
      // 好友增加
      message = `+ [friend increase:${event.nickname}(${user_id})]`
    } else if (sub_type === 'poke') {
      // 好友戳一戳
      const { target_id, operator_id, friend } = event

      const isOperatorSelf = operator_id === this.uin
      const isTargetSelf = target_id === this.uin

      // 触发方
      const operator = isOperatorSelf
        ? `${this.nickname}(${this.uin})`
        : `${friend.nickname}(${friend.user_id})`

      // 被戳方
      const target = isTargetSelf
        ? `${this.nickname}(${this.uin})`
        : `${friend.nickname}(${friend.user_id})`

      message = `↓ [prvate poke:${operator}->${target}]`
    } else if (sub_type === 'recall') {
      // 私聊撤回
      const { friend, operator_id, message_id } = event

      const isOperatorSelf = operator_id === this.uin
      const friendinfo = `${friend.nickname}(${friend.user_id})`

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : friendinfo

      message = `↓ [prvate recall:${friendinfo}] [${operator}:${message_id}]`
    }
  } else if (event.notice_type === 'group') {
    // 群通知
    const groupInfo = `${event.group.name}(${event.group.gid})`

    if (sub_type === 'admin') {
      // 群管理变动
      const { set } = event

      if (set) {
        message = `+ [new admin:${groupInfo}-${user_id}]`
      } else {
        message = `- [cancel admin:${groupInfo}-${user_id}]`
      }
    } else if (sub_type === 'ban') {
      // 群禁言
      const { duration, operator_id } = event

      const isBan = duration !== 0
      const label = isBan ? '+ [ban' : '- [unban'
      const desc = `${groupInfo}-${operator_id}->${user_id}${isBan ? `-${duration}min` : ''}`

      message = `${label}:${desc}]`
    } else if (sub_type === 'decrease') {
      // 群人数减少
      const { operator_id } = event
      message = `- [leave group:${groupInfo}-${operator_id || 'subjective'}->${user_id}]`
    } else if (sub_type === 'increase') {
      // 群人数增加
      message = `+ [join group:${groupInfo}-${user_id}]`
    } else if (sub_type === 'poke') {
      // 群戳一戳
      const { target_id, operator_id } = event

      const isOperatorSelf = operator_id === this.uin
      const isTargetSelf = target_id === this.uin

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id

      // 被戳方
      const target = isTargetSelf ? `${this.nickname}(${this.uin})` : target_id

      message = `↓ [group poke:${operator}->${target}]`
    } else if (sub_type === 'recall') {
      // 群聊撤回
      const { operator_id, message_id } = event

      const isOperatorSelf = operator_id === this.uin

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id

      message = `↓ [group recall:${groupInfo}-${operator_id}] [${operator}:${message_id}]`
    } else if (sub_type === 'transfer') {
      // 群聊转让
      const { operator_id } = event

      const isOperatorSelf = operator_id === this.uin

      // 触发方
      const operator = isOperatorSelf ? `${this.nickname}(${this.uin})` : operator_id

      message = `↓ [group transfer:${groupInfo}] [${operator}->${user_id}]`
    }
  }

  KiviLogger.info(colors.gray(message))
}
