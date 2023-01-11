import minimist from 'minimist'

import { fetchStatus } from './status'
import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import { KiviLogger } from '@src'
import { notice, stringifyError, update } from '@src/utils'
import { pkg } from '@/start'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

const HelpMenu = `
〓 KiviBot 帮助 〓
/plugin 插件操作
/status 查看状态
/config 框架配置
/update 检查更新
/about 关于框架
/exit 退出框架
`.trim()

const AboutText = `
〓 关于 KiviBot 〓
KiviBot 是一个开源、轻量、跨平台、注重体验、开发者友好、能跑就行的 QQ 机器人框架，基于 Node.js 和 oicq v2 构建。
使用文档: https://beta.kivibot.com/
开源地址: https://github.com/KiviBotLab/KiviBot
`.trim()

/** 解析框架命令，进行框架操作，仅框架主管理有权限 */
export async function handleKiviCommand(event: AllMessageEvent, bot: Client, kiviConf: KiviConf) {
  const msg = event.toString().trim()

  if (!/^\s*\/[a-z0-9]+/i.test(msg)) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _: params, '--': __, ...options } = minimist(msg.split(/\s+/))
  const cmd = params.shift()?.replace(/^\s*\//, '') ?? ''

  // 是否是管理员
  const isAdmin = kiviConf.admins.includes(event.sender.user_id)
  // 是否是主管理员
  const isMainAdmin = kiviConf.admins[0] === event.sender.user_id

  // 过滤非管理员消息
  if (!isAdmin) {
    return
  }

  if (cmd === 'help') {
    return event.reply(HelpMenu)
  }

  if (cmd === 'about') {
    return event.reply(AboutText)
  }

  if (cmd === 'status') {
    try {
      const status = await fetchStatus(bot)
      return event.reply(status)
    } catch (e) {
      KiviLogger.error(JSON.stringify(e, null, 2))
      return event.reply('〓 设备状态获取失败 〓\n错误信息:\n' + JSON.stringify(e, null, 2))
    }
  }

  // 过滤非主管理员命令
  if (!isMainAdmin) {
    return
  }

  if (cmd === 'exit') {
    await event.reply('〓 KiviBot 进程已停止 〓')

    notice.success('框架进程已由管理员通过 /exit 消息指令退出')
    process.exit(0)
  }

  if (cmd === 'plugin' || cmd === 'p') {
    return handlePluginCommand(bot, params, event.reply.bind(event))
  }

  if (cmd === 'config') {
    return handleConfigCommand(bot, params, event.reply.bind(event))
  }

  if (cmd === 'update') {
    event.reply('〓 正在检查更新... 〓')

    try {
      const upInfo = await update()

      if (upInfo) {
        const info = Object.entries(upInfo)
          .map(([k, v]) => `${k.replace('kivibot-plugin-', 'plugin: ')} => ${v.replace('^', '')}`)
          .join('\n')

        const msg = info
          ? `〓 更新成功 〓\n${info}\ntip: 需要重启框架才能生效`
          : '〓 已是最新版本 〓'

        await event.reply(msg)
      } else {
        await event.reply('〓 更新失败，详情查看日志 〓')
      }
    } catch (e) {
      KiviLogger.error(stringifyError(e))
      await event.reply(`〓 更新失败 〓\n错误信息: ${stringifyError(e)}`)
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`
  }
}
