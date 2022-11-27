import { ActionMap, kiviConf, ModeMap, saveKiviConf } from '@/config'
import { parseUin, update, exitWithError } from '@src/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigText = `
〓 设置指令 〓
#设置 详情
#设置 加管理 <qq>
#设置 删管理 <qq>
#设置 开启通知
#设置 关闭通知
#设置 检查更新
#设置 退出
`.trim()

export async function handleConfigCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    await reply(ConfigText)
  }

  const [secondCmd, value] = params

  if (secondCmd === '详情') {
    const detail = `
〓 设置总览 〓
登录模式：${ModeMap[kiviConf.login_mode] ?? ''}
设备锁模式：${ModeMap[kiviConf.login_mode] ?? ''}
主管理员：${kiviConf.admins[0] ?? ''}
副管理员：${kiviConf.admins.slice(1).join(', ')}
通知状态：${kiviConf.notice.enable ? '开启' : '关闭'}
`.trim()

    const { group, friend } = kiviConf.notice

    const noticeDetail = `
〓 通知详细设置 〓
〇 好友设置：
- 好友请求：${friend.request ? '开启' : '关闭'}
- 好友增加：${friend.increase ? '开启' : '关闭'}
- 好友减少：${friend.decrease ? '开启' : '关闭'}
- 私聊消息：${friend.message ? '开启' : '关闭'}
〇 群聊设置：
- 群禁言：${group.ban ? '开启' : '关闭'}
- 群转让：${group.transfer ? '开启' : '关闭'}
- 群增加：${group.increase ? '开启' : '关闭'}
- 群减少：${group.decrease ? '开启' : '关闭'}
- 邀请进群：${group.request.enable ? '开启' : '关闭'}
- 管理变动：${group.admin ? '开启' : '关闭'}
〇 请求处理：
- 好友申请：${ActionMap[friend.request.action] ?? ''}
- 邀请进群：${ActionMap[friend.request.action] ?? ''}
`.trim()

    const isNoticeEnable = kiviConf.notice.enable
    const noticeInfo = isNoticeEnable ? `\n\n${noticeDetail}` : ''
    const message = `${detail}${noticeInfo}`

    return reply(message)
  }

  const mainAdmin = kiviConf.admins[0]

  if (secondCmd === '加管理') {
    const qq = parseUin(value)

    if (!qq) {
      return reply('〓 命令格式错误 〓')
    } else {
      const set = new Set(kiviConf.admins.splice(1))

      if (set.has(qq) || qq === mainAdmin) {
        return reply('〓 目标已是管理员 〓')
      }

      set.add(qq)

      kiviConf.admins = [mainAdmin, ...set]

      const isOK = saveKiviConf()

      if (isOK) {
        bot.emit('kivi.admin', { admins: [...kiviConf.admins] })
      }

      return reply(isOK ? '〓 已添加 Bot 管理员 〓' : '〓 添加失败，读写异常 〓')
    }
  }

  if (secondCmd === '删管理') {
    const qq = parseUin(value)

    if (!qq) {
      return reply('〓 命令格式错误 〓')
    } else {
      const set = new Set(kiviConf.admins.slice(1))

      if (qq === mainAdmin) {
        return reply('〓 无法删除主管理员 〓')
      }

      if (!set.has(qq)) {
        return reply('〓 目标不是管理员 〓')
      }

      set.delete(qq)

      kiviConf.admins = [mainAdmin, ...set]

      const isOK = saveKiviConf()

      if (isOK) {
        bot.emit('kivi.admin', { admins: [...kiviConf.admins] })
      }

      return reply(isOK ? '〓 已删除 Bot 管理员 〓' : '〓 添加失败，配置读写异常 〓')
    }
  }

  if (secondCmd === '开启通知') {
    kiviConf.notice.enable = true

    const isOK = saveKiviConf()

    return reply(isOK ? '〓 已开启通知 〓' : '〓 开启失败，配置读写异常 〓')
  }

  if (secondCmd === '关闭通知') {
    kiviConf.notice.enable = false

    const isOK = saveKiviConf()

    return reply(isOK ? '〓 已关闭通知 〓' : '〓 关闭失败，配置读写异常 〓')
  }

  if (secondCmd === '检查更新') {
    reply('开始更新...')
    const isOK = await update()
    return reply(isOK ? '〓 更新成功 〓' : '〓 更新失败 〓')
  }

  if (secondCmd === '退出') {
    await reply('〓 下次见 〓')

    exitWithError('进程已由主管理员通过消息命令停止')
  }
}
