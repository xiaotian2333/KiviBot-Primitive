import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import parseCommand from '@src/utils/parseCommand'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/start'

const HelpText = `
#插件 | #状态
#设置 | #关于`.trim()

const AboutText = `
KiviBot v1.0.0
轻量、跨平台的机器人框架
使用文档：kivibot.com`.trim()

/** 解析框架命令，进行框架操作，仅框架主管理有权限 */
export async function handleKiviCommand(event: AllMessageEvent, bot: Client, conf: KiviConf) {
  const { sender, raw_message } = event

  const reply = event.reply.bind(event)

  // 是否是主管理员
  const isMainAdmin = conf.admins[0] === sender.user_id

  // 忽略非主管理员命令
  if (!isMainAdmin) return

  // 解析框架命令和参数
  const { cmd, params, nums } = parseCommand(raw_message)

  if (cmd === '#帮助' && nums === 0) {
    return reply(HelpText)
  }

  if (cmd === '#关于' && nums === 0) {
    return reply(AboutText)
  }

  if (cmd === '#状态' && nums === 0) {
    const status = await fetchStatus(bot)
    return reply(status)
  }

  if (cmd === '#插件') {
    return handlePluginCommand(bot, params, reply)
  }

  if (cmd === '#设置') {
    return handleConfigCommand(bot, params, reply)
  }

  // if (raw_message === '#重载插件') {
  //   plugins.forEach((p) => p.unmountKiviBotClient(bot, conf.admins))

  //   killPlugin('/home/viki/Workspace/KiviBot/lib/examples/demoPlugin.js')

  //   try {
  //     const plugin = (await import('../../examples/demoPlugin')).default
  //     plugins.set('demoPlugin', plugin)

  //     try {
  //       plugin.mountKiviBotClient(bot, conf.admins)
  //     } catch (e) {
  //       // error(`插件挂载（onMounted）过程中发生错误: `, e)
  //     }
  //   } catch (e) {
  //     // error(`插件导入（import）过程中发生错误: `, e)
  //   }
  // }
}
