import { segment } from 'oicq'

import { ActionMap, kiviConf } from './config'
import { formatDateDiff, getGroupAvatarLink, getQQAvatarLink } from '@src/utils'

import type { Client, ImageElem } from 'oicq'

export const RoleMap = {
  admin: '群管理员',
  member: '群成员',
  owner: '群主'
} as const

function buildNotice(title: string, avatar: ImageElem, content: string) {
  return [`〓 ${title} 〓\n`, avatar, `\n${content}`]
}

/** 处理消息通知 */
export function configNotice(bot: Client) {
  const { notice, admins } = kiviConf
  const { friend, group } = notice

  const mainAdmin = bot.pickUser(admins[0])

  // 好友私聊
  bot.on('message.private', (event) => {
    if (!kiviConf.notice.enable || !friend.message) return

    const { sender, message } = event

    if (sender.user_id === admins[0]) return

    const avatar = segment.image(getQQAvatarLink(sender.user_id, 100))

    const msg = `
昵称: ${sender.nickname}
QQ: ${sender.user_id}

〓 消息内容 〓\n`.trimStart()
    mainAdmin.sendMsg([...buildNotice('私聊通知', avatar, msg), ...message])
  })

  // 好友申请
  bot.on('request.friend.add', async (event) => {
    if (friend.request.action !== 'ignore') {
      const action = friend.request.action === 'accept'
      await event.approve(action)
    }

    if (!kiviConf.notice.enable || !friend.request.enable) return

    const { user_id, nickname, comment, source } = event
    const avatar = segment.image(getQQAvatarLink(user_id, 100))

    const msg = `
昵称: ${nickname}
QQ: ${user_id}
来源: ${source}
附加信息: ${comment}
已${ActionMap[friend.request.action]}
`.trim()

    mainAdmin.sendMsg(buildNotice('好友申请', avatar, msg))
  })

  // 新增好友
  bot.on('notice.friend.increase', async (event) => {
    if (!kiviConf.notice.enable || !friend.increase) return

    const { nickname, user_id } = event
    const avatar = segment.image(getQQAvatarLink(user_id, 100))

    const msg = `
昵称: ${nickname}
QQ: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('新增好友', avatar, msg))
  })

  // 好友减少
  bot.on('notice.friend.decrease', async (event) => {
    if (!kiviConf.notice.enable || !friend.decrease) return

    const { nickname, user_id } = event
    const avatar = segment.image(getQQAvatarLink(user_id, 100))

    const msg = `
昵称: ${nickname}
QQ: ${user_id}
  `.trim()

    mainAdmin.sendMsg(buildNotice('好友减少', avatar, msg))
  })

  // 邀请机器人进群
  bot.on('request.group.invite', async (event) => {
    if (group.request.action !== 'ignore') {
      const action = group.request.action === 'accept'
      await event.approve(action)
    }

    if (!kiviConf.notice.enable || !friend.request.enable) return

    const { user_id, nickname, group_id, group_name, role } = event
    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
目标群名: ${group_name}
目标群号: ${group_id}
邀请人昵称: ${nickname}
邀请人QQ: ${user_id}
邀请人群身份: ${RoleMap[role]}
已${ActionMap[group.request.action]}
`.trim()

    mainAdmin.sendMsg(buildNotice('邀请 Bot 进群', avatar, msg))
  })

  // 新增群聊
  bot.on('notice.group.increase', async (event) => {
    if (!kiviConf.notice.enable || !group.increase) return

    const {
      user_id,
      group: { group_id, name }
    } = event

    if (user_id !== bot.uin) return

    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
群名: ${name}
群号: ${group_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('新增群聊', avatar, msg))
  })

  // 群聊减少
  bot.on('notice.group.decrease', async (event) => {
    if (!kiviConf.notice.enable || !group.decrease) return

    const {
      user_id,
      operator_id,
      group: { group_id, name }
    } = event

    if (user_id !== bot.uin) return

    const isKick = operator_id !== bot.uin
    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
群名: ${name}
群号: ${group_id}
${isKick ? `操作人: ${operator_id}` : ''}
`.trim()

    mainAdmin.sendMsg(buildNotice(isKick ? 'Bot 被踢' : 'Bot 主动退群', avatar, msg))
  })

  // 群管理变动
  bot.on('notice.group.admin', async (event) => {
    if (!kiviConf.notice.enable || !group.admin) return

    const {
      user_id,
      set,
      group: { group_id, name }
    } = event

    if (user_id !== bot.uin) return

    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
群名: ${name}
群号: ${group_id}
被操作 QQ: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice(set ? '新增群管理' : '群管理被取消', avatar, msg))
  })

  // Bot 被禁言
  bot.on('notice.group.ban', async (event) => {
    if (!kiviConf.notice.enable || !group.admin) return

    const {
      user_id,
      duration,
      operator_id,
      group: { group_id, name }
    } = event

    if (user_id !== bot.uin) return

    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
群名: ${name}
群号: ${group_id}
操作 QQ: ${operator_id}
禁言时长: ${formatDateDiff(duration * 1000, true, true)}
`.trim()

    mainAdmin.sendMsg(buildNotice('Bot 被禁言', avatar, msg))
  })

  // 群转让
  bot.on('notice.group.transfer', async (event) => {
    if (!kiviConf.notice.enable || !group.admin) return

    const {
      user_id,
      operator_id,
      group: { group_id, name }
    } = event

    const avatar = segment.image(getGroupAvatarLink(group_id, 100))

    const msg = `
群名: ${name}
群号: ${group_id}
原群主 QQ: ${operator_id}
新群主 QQ: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('群聊被转让', avatar, msg))
  })
}
