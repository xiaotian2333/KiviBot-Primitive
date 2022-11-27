import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import { parseCommand } from '@src/utils'
import { pkg } from '@/start'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

const HelpText = `
〓 KiviBot 〓
#插件 | #状态
#设置 | #关于`.trim()

const AboutText = `
〓 KiviBot v${pkg.version || '未知'} 〓
轻量跨平台 の QQ 机器人框架
使用 Node.js 和 oicq2 构建`.trim()

/** 解析框架命令，进行框架操作，仅框架主管理有权限 */
export async function handleKiviCommand(event: AllMessageEvent, bot: Client, kiviConf: KiviConf) {
  const { sender, raw_message } = event

  const reply = event.reply.bind(event)

  // 是否是管理员
  const isAdmin = kiviConf.admins.includes(sender.user_id)
  // 是否是主管理员
  const isMainAdmin = kiviConf.admins[0] === sender.user_id

  // 过滤非管理员消息
  if (!isAdmin) return

  if (raw_message.trim() === '#帮助') {
    return reply(HelpText)
  }

  if (raw_message.trim() === '#关于') {
    return reply(AboutText)
  }

  if (raw_message.trim() === '#状态') {
    try {
      const status = await fetchStatus(bot)
      return reply(status)
    } catch (e) {
      return reply('状态加载异常，错误信息：' + e)
    }
  }

  // 过滤非主管理员命令
  if (!isMainAdmin) return

  // 解析框架命令和参数
  const { cmd, params } = parseCommand(event.toString())

  if (cmd === '#插件') {
    return handlePluginCommand(bot, params, reply)
  }

  if (cmd === '#设置') {
    return handleConfigCommand(bot, params, reply)
  }
}
