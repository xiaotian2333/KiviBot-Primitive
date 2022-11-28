import { segment } from 'oicq'

import { kiviConf } from './config'
import { formatDateDiff, getGroupAvatarLink, getQQAvatarLink } from '@src/utils'

import type { Client, ImageElem } from 'oicq'

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
nickname: ${sender.nickname}
qq: ${sender.user_id}
〓 Content 〓\n`.trimStart()
    mainAdmin.sendMsg([...buildNotice('Friend Message', avatar, msg), ...message])
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
nickname: ${nickname}
qq: ${user_id}
from: ${source}
comment: ${comment}
operation: ${[friend.request.action]}
`.trim()

    mainAdmin.sendMsg(buildNotice('Friend Request', avatar, msg))
  })

  // 新增好友
  bot.on('notice.friend.increase', async (event) => {
    if (!kiviConf.notice.enable || !friend.increase) return

    const { nickname, user_id } = event
    const avatar = segment.image(getQQAvatarLink(user_id, 100))

    const msg = `
nickname: ${nickname}
qq: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('Friend Increase', avatar, msg))
  })

  // 好友减少
  bot.on('notice.friend.decrease', async (event) => {
    if (!kiviConf.notice.enable || !friend.decrease) return

    const { nickname, user_id } = event
    const avatar = segment.image(getQQAvatarLink(user_id, 100))

    const msg = `
nickname: ${nickname}
QQ: ${user_id}
  `.trim()

    mainAdmin.sendMsg(buildNotice('Friend Decrease', avatar, msg))
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
target group: ${group_name}
target group id: ${group_id}
invitor: ${nickname}(${user_id}, ${role})
operation: ${group.request.action}
`.trim()

    mainAdmin.sendMsg(buildNotice('Invit to Group', avatar, msg))
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
group name: ${name}
group id: ${group_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('Group Increase', avatar, msg))
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
group name: ${name}
group id: ${group_id}
${isKick ? `operator: ${operator_id}` : ''}
`.trim()

    mainAdmin.sendMsg(buildNotice(isKick ? 'Bot been Kick' : 'Leave Group', avatar, msg))
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
group name: ${name}
group id: ${group_id}
target: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice(set ? 'New Group Admin' : 'Cancel Group Admin', avatar, msg))
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
group name: ${name}
group id: ${group_id}
operator: ${operator_id}
duration: ${formatDateDiff(duration * 1000, true, true)}
`.trim()

    mainAdmin.sendMsg(buildNotice('Bot been Banned', avatar, msg))
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
group name: ${name}
group id: ${group_id}
operator: ${operator_id}
new owner: ${user_id}
`.trim()

    mainAdmin.sendMsg(buildNotice('Transfer Group', avatar, msg))
  })
}
