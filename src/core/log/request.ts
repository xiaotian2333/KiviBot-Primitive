import type { FriendRequestEvent, GroupInviteEvent, GroupRequestEvent } from 'icqq'

import { KeliLogger } from '@/core'
import { colors } from '@/utils'

export type AllRequestEvent = FriendRequestEvent | GroupRequestEvent | GroupInviteEvent

/** 请求监听函数，打印框架日志 */
export function requestHandler(event: AllRequestEvent) {
  const { request_type, sub_type, user_id, nickname } = event
  let message = ''
  const userInfo = `${nickname}(${user_id})`

  if (request_type === 'friend') {
    // 好友通知
    const { comment, source } = event

    if (sub_type === 'add') {
      message = `+ [Friend Request:${userInfo}-${source}-${comment}]`
    } else if (sub_type === 'single') {
      message = `+ [Single Friend Request:${userInfo}-${source}-${comment}]`
    }
  } else if (request_type === 'group') {
    // 群通知
    const { group_id, group_name } = event
    const groupInfo = `${group_name}(${group_id})`

    if (sub_type === 'add') {
      message = `+ [Group Request:${groupInfo}-${userInfo}]`
    } else if (sub_type === 'invite') {
      const { role } = event
      message = `+ [Group Invite:${groupInfo}-${userInfo}-${role}]`
    }
  }

  KeliLogger.info(colors.gray(message))
}
