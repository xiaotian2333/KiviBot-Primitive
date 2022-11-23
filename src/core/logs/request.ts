import { KiviLogger } from '@/log'
import { colors } from '@src/utils'

import type { FriendRequestEvent, GroupInviteEvent, GroupRequestEvent } from 'oicq'

export type AllRequestEvent = FriendRequestEvent | GroupRequestEvent | GroupInviteEvent

const RoleMap: Record<string, string> = {
  admin: `群管理`,
  owner: `群主`,
  member: `群员`
} as const

/** 请求监听函数，打印框架日志 */
export function requestHandler(event: AllRequestEvent) {
  const { request_type, sub_type, user_id, nickname } = event
  let message = ''
  const userInfo = `${nickname}(${user_id})`

  if (request_type === 'friend') {
    // 好友通知
    const { comment, source } = event

    if (sub_type === 'add') {
      message = `+ [好友申请:${userInfo}-${source}-${comment}]`
    } else if (sub_type === 'single') {
      message = `+ [单向好友:${userInfo}-${source}-${comment}]`
    }
  } else if (request_type === 'group') {
    // 群通知
    const { group_id, group_name } = event
    const groupInfo = `${group_name}(${group_id})`

    if (sub_type === 'add') {
      message = `+ [申请进群:${groupInfo}-${userInfo}]`
    } else if (sub_type === 'invite') {
      const { role } = event
      message = `+ [邀请进群:${groupInfo}-${userInfo}-${RoleMap[role]}]`
    }
  }

  KiviLogger.info(colors.gray(message))
}
