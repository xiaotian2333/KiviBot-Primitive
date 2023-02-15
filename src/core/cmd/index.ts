import minimist from 'minimist'
import str2argv from 'string2argv'

import { handleConfigCommand } from './config'
import { handlePluginCommand } from './plugin'
import { fetchStatus } from './status'
import { Devices } from '@/core'
import { KeliLogger } from '@/src'
import { notice, stringifyError, update, v } from '@/utils'

import type { KeliConf, AllMessageEvent } from '@/core'
import type { Client } from 'movo'

const HelpMenu = `
〓 keli 帮助 〓
/plugin 插件操作
/status 查看状态
/config 框架配置
/update 检查更新
/about 关于框架
/exit 退出框架
`.trim()

const AboutText = `
〓 关于 keli 〓
能跑就行 の Bot，基于 Node.js 和 movo 构建。
`.trim()

/** 解析框架命令，进行框架操作，仅框架主管理有权限 */
export async function handleKeliCommand(event: AllMessageEvent, bot: Client, keliConf: KeliConf) {
  const msg = event.toString().trim()

  if (!/^\s*\/\w+/i.test(msg)) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _: params, '--': __, ...options } = minimist(str2argv(msg))
  const cmd = params.shift()?.replace(/^\s*\//, '') ?? ''

  // 是否是管理员
  const isAdmin = keliConf.admins.includes(event.sender.user_id)
  // 是否是主管理员
  const isMainAdmin = keliConf.admins[0] === event.sender.user_id

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
      KeliLogger.error(stringifyError(e))
      return event.reply('〓 设备状态获取失败 〓\n' + stringifyError(e))
    }
  }

  // 过滤非主管理员命令
  if (!isMainAdmin) {
    return
  }

  if (cmd === 'exit') {
    await event.reply('〓 keli 进程已停止 〓')

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
    await event.reply('〓 正在检查更新... 〓')

    try {
      const { isOK, info } = await update()

      if (isOK) {
        const msg = info ? `〓 更新成功 〓\n${info}\n需要重启框架才能生效` : '〓 已是最新版本 〓'

        await event.reply(msg)
      } else {
        await event.reply('〓 更新失败，详情查看日志 〓')
      }
    } catch (e) {
      KeliLogger.error(stringifyError(e))
      await event.reply(`〓 更新失败 〓\n${stringifyError(e)}`)
    }

    // 终端标题加上账号
    const protocol = Devices[Number(keliConf.oicq_config.platform)] || 'unknown'
    process.title = `keli v${v} ${keliConf.account}-${protocol}`
  }
}
