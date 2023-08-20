import { searchAllPlugins } from '@kivi-dev/shared'
import { filesize } from 'filesize'
import os from 'node:os'
import prettyMilliseconds from 'pretty-ms'

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

// oicq 登录协议：1 为安卓手机, 2 为安卓平板, 3 为安卓手表, 4 为 MacOS, 5 为 iPad
export const DeviceMap: Record<number, string> = {
  1: '安卓 Phone',
  2: '安卓 Pad',
  3: '安卓 Watch',
  4: 'MacOS',
  5: 'iPad',
  6: '备选协议',
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
〓 Kivi 框架实时状态 〓
昵称: ${bot.nickname}
账号: ${bot.uin}
列表: ${bot.fl.size} 好友，${bot.gl.size} 群
插件: 启用 ${enablePluginCount} 个，共 ${localPluginCount} 个
收发: 收 ${recv_msg_cnt}，发 ${sent_msg_cnt}
速率: ${msg_cnt_per_min} 条/分钟
运行: ${runTime}
框架: v${kv}-${filesize(rss)}-${per(rss)}%
协议: icqq-v${iv}-${DeviceMap[bot.config.platform]}
系统: ${SystemMap[os.type()] || os.type()}-${arch}-node${nv}
内存: ${filesize(used)}/${filesize(total)}-${per(used)}%
`.trim()
}
