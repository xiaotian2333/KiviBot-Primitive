import { mioConf, saveMioConf } from '@/core'
import { parseUin } from '@/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigMenu = `
〓 miobot 配置 〓
/config detail
/config admin add/rm <qq>
/config notice on/off
/config friend <operation>
/config group <operation>
`.trim()

export type Operation = 'refuse' | 'ignore' | 'accept'

export const operations = ['refuse', 'ignore', 'accept'] as const

export const OperationMap = {
  refuse: '拒绝',
  accept: '同意',
  ignore: '忽略'
} as const

export const ModeMap = {
  sms: '短信',
  password: '密码',
  qrcode: '扫码'
} as const

export type ReplyFunc = (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>

export async function handleConfigCommand(bot: Client, params: string[], reply: ReplyFunc) {
  if (!params.length) {
    return reply(ConfigMenu)
  }

  const [secondCmd, thirdCmd, value] = params

  if (secondCmd === 'detail') {
    const { friend } = mioConf.notice

    const subAdmins = mioConf.admins.slice(1)

    const detail = `
〓 miobot 详细配置 〓
登录模式: ${ModeMap[mioConf.login_mode] ?? '未知'}
设备锁模式: ${ModeMap[mioConf.device_mode] ?? '未知'}
主管理员: ${mioConf.admins[0] ?? '未知'}
副管理员: ${subAdmins.length ? subAdmins.join(', ') : '空'}
通知状态: ${mioConf.notice.enable ? '开启' : '关闭'}
好友申请操作: ${OperationMap[friend.request.action] ?? '未知'}
群聊邀请操作: ${OperationMap[friend.request.action] ?? '未知'}
`.trim()

    return reply(detail)
  }

  const mainAdmin = mioConf.admins[0]

  if (secondCmd === 'admin') {
    const qq = parseUin(value)

    if (!qq) {
      return reply('/config admin add/rm <qq>')
    } else {
      const set = new Set(mioConf.admins.splice(1))

      if (thirdCmd === 'add') {
        if (set.has(qq) || qq === mainAdmin) {
          return reply('〓 该账号已是 Bot 管理员 〓')
        }

        set.add(qq)

        mioConf.admins = [mainAdmin, ...set]

        if (saveMioConf()) {
          bot.emit('mio.admin', { admins: [...mioConf.admins] })
          return reply('〓 Bot 管理员添加成功 〓')
        }
      } else if (thirdCmd === 'rm') {
        if (qq === mainAdmin) {
          return reply('〓 无法删除 Bot 主管理员 〓')
        }

        if (!set.has(qq)) {
          return reply('〓 该账号不是 Bot 管理员 〓')
        }
        set.delete(qq)

        mioConf.admins = [mainAdmin, ...set]

        if (saveMioConf()) {
          bot.emit('mio.admin', { admins: [...mioConf.admins] })

          return reply('〓 Bot 管理员删除成功 〓')
        }
      }
    }
  }

  if (secondCmd === 'notice') {
    if (thirdCmd === 'on') {
      mioConf.notice.enable = true

      if (saveMioConf()) {
        return reply('〓 事件通知已开启 〓')
      }
    } else if (thirdCmd === 'off') {
      mioConf.notice.enable = false

      if (saveMioConf()) {
        return reply('〓 事件通知已关闭 〓')
      }
    }
  }

  if (secondCmd === 'group') {
    if (!operations.includes(<Operation>thirdCmd)) {
      return reply(`〓 操作无效，请检查 〓\n可选操作：${operations.join(', ')}`)
    }

    mioConf.notice.group.request.action = <Operation>thirdCmd

    if (saveMioConf()) {
      return reply(`〓 已设置自动${OperationMap[<Operation>thirdCmd]}群聊邀请 〓`)
    }
  }

  if (secondCmd === 'friend') {
    if (!operations.includes(<Operation>thirdCmd)) {
      return reply(`〓 操作无效，请检查 〓\n可选操作：${operations.join(', ')}`)
    }

    mioConf.notice.friend.request.action = <Operation>thirdCmd

    if (saveMioConf()) {
      return reply(`〓 已设置自动${OperationMap[<Operation>thirdCmd]}好友申请 〓`)
    }
  }
}
