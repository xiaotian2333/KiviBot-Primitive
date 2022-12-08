import minimist from 'minimist'

import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import { notice, update } from '@src/utils'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

const HelpText = `
〓 KiviBot Help 〓
/plugin\t/status
/config\t/update
/about\t/exit
`.trim()

const AboutText = `
〓 About KiviBot 〓
    KiviBot is a lightweight cross-platform Tencent QQ robot frame, powered by Node.js & oicq2.
    Head to https://github.com/KiviBotLab/KiviBot for more infomation.
    Source code: https://github.com/KiviBotLab/KiviBot.
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

  if (cmd === 'exit') {
    await reply('〓 see you later 〓')

    notice.success('main process has been exit by admin via message command')
    process.exit(0)
  }

  if (cmd === 'plugin') {
    return handlePluginCommand(bot, params, reply)
  }

  if (cmd === 'config') {
    return handleConfigCommand(bot, params, reply)
  }

  if (cmd === 'update') {
    reply('〓 checking update... 〓')

    const upInfo = await update()

    if (upInfo) {
      const info = Object.entries(upInfo)
        .map(([k, v]) => `${k} => ${v}`)
        .join('\n')

      return reply(info ? `〓 done 〓\n${info}` : '〓 up to date 〓')
    } else {
      return reply('〓 faild 〓')
    }
  }
}
