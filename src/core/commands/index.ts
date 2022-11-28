import minimist from 'minimist'

import { exitWithError } from '@src/utils'
import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

const HelpText = `
〓 KiviBot Help 〓
/plugin
/status
/conf
/about
/exit
`.trim()

const AboutText = `
〓 About KiviBot 〓
KiviBot is a lightweight cross-platform Tencent QQ robot frame, powered by Node.js & oicq2.
`.trim()

/** 解析框架命令，进行框架操作，仅框架主管理有权限 */
export async function handleKiviCommand(event: AllMessageEvent, bot: Client, kiviConf: KiviConf) {
  const msg = event.toString().trim()

  if (!/^\/[a-z]+/.test(msg)) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _: params, '--': __, ...options } = minimist(msg.split(/\s+/))
  const cmd = params.shift()?.replace('/', '') || ''

  const reply = event.reply.bind(event)

  // 是否是管理员
  const isAdmin = kiviConf.admins.includes(event.sender.user_id)
  // 是否是主管理员
  const isMainAdmin = kiviConf.admins[0] === event.sender.user_id

  // 过滤非管理员消息
  if (!isAdmin) return

  if (cmd === 'help') {
    return reply(HelpText)
  }

  if (cmd === 'about') {
    return reply(AboutText)
  }

  if (cmd === 'exit') {
    await reply('〓 see you later 〓')

    exitWithError('main process has been exit by admin via message command')
  }

  if (cmd === 'status') {
    try {
      const status = await fetchStatus(bot)
      return reply(status)
    } catch (e) {
      return reply('failed to fetch device status info, error message: ' + e)
    }
  }

  // 过滤非主管理员命令
  if (!isMainAdmin) return

  if (cmd === 'plugin') {
    return handlePluginCommand(bot, params, reply)
  }

  if (cmd === 'config') {
    return handleConfigCommand(bot, params, reply)
  }
}
