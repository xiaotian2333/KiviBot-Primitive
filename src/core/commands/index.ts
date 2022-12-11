import minimist from 'minimist'

import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import { KiviLogger } from '@src'
import { notice, update } from '@src/utils'
import { pkg } from '@/start'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

const HelpText = `
〓 KiviBot 帮助 〓
/plugin\t插件操作
/status\t查看状态
/config\t框架配置
/update\t检查更新
/about \t关于框架
/exit  \t退出框架
`.trim()

const AboutText = `
〓 关于 KiviBot 〓
    KiviBot 是一个开源、轻量、跨平台的 QQ 机器人框架，基于 Node.js 和 oicq v2 构建。
官网: https://beta.kivibot.com/
开源地址: https://github.com/KiviBotLab/KiviBot
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
      KiviLogger.error(JSON.stringify(e, null, 2))
      return reply('获取设备状态信息失败，错误信息:\n' + JSON.stringify(e, null, 2))
    }
  }

  // 过滤非主管理员命令
  if (!isMainAdmin) return

  if (cmd === 'exit') {
    await reply('〓 再会 〓')

    notice.success('框架进程已由管理员通过 /exit 消息指令退出')
    process.exit(0)
  }

  if (cmd === 'plugin') {
    return handlePluginCommand(bot, params, reply)
  }

  if (cmd === 'config') {
    return handleConfigCommand(bot, params, reply)
  }

  if (cmd === 'update') {
    reply('〓 正在检查更新... 〓')

    const upInfo = await update()

    if (upInfo) {
      const info = Object.entries(upInfo)
        .map(([k, v]) => `${k} => ${v.replace('^', '')}`)
        .join('\n')

      await reply(info ? `〓 更新完成 〓\n${info}` : '〓 已是最新 〓')
    } else {
      await reply('〓 失败 〓')
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`
  }
}
