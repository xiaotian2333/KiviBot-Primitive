import { searchAllPlugins } from '@kivi-dev/shared'
import { filesize } from 'filesize'
import os from 'node:os'
import prettyMilliseconds from 'pretty-ms'

import { DEVICE_MAP } from './constants.js'
import { require } from './utils.js'

import type { BotConfig, ClientWithApis } from '@kivi-dev/types'

export const SystemMap: Record<string, string> = {
  Linux: 'Linux',
  Darwin: 'macOS',
  Windows_NT: 'Win',
}

export const ArchMap: Record<string, string> = {
  ia32: 'x86',
  arm: 'arm',
  arm64: 'arm64',
  x64: 'x64',
}

/** 运行状态指令处理函数 */
export async function fetchStatus(bot: ClientWithApis, botConfig?: BotConfig) {
  const localPluginCount = (await searchAllPlugins()).length
  const enablePluginCount = botConfig?.plugins?.length || 0

  const total = os.totalmem()
  const used = total - os.freemem()
  const rss = process.memoryUsage.rss()
  const runTime = prettyMilliseconds(process.uptime() * 1000, { compact: true })

  const per = (param: number) => ((param / total) * 100).toFixed(1)

  const { recv_msg_cnt, msg_cnt_per_min, sent_msg_cnt } = bot.stat

  const nv = process.versions.node.split('.')[0]
  const kv = require('../package.json')?.version
  const iv = require('icqq/package.json')?.version || 'unknown'

  const arch = ArchMap[process.arch] || process.arch

  return `
〓 KiviBot 状态 〓
昵称: ${bot.nickname}
账号: ${bot.uin}
列表信息: ${bot.fl.size} 好友，${bot.gl.size} 群
插件信息: 启用 ${enablePluginCount} 个，共 ${localPluginCount} 个
消息收发: 收 ${recv_msg_cnt}，发 ${sent_msg_cnt}
当前速率: ${msg_cnt_per_min} 条/分钟
运行时长: ${runTime}
框架状态: v${kv}-${filesize(rss)}-${per(rss)}%
协议信息: icqq-v${iv}-${DEVICE_MAP[bot.config.platform]}
系统信息: ${SystemMap[os.type()] || os.type()}-${arch}-node${nv}
系统内存: ${filesize(used)}/${filesize(total)}-${per(used)}%
`.trim()
}
