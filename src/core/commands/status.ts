import os from 'node:os'
import path from 'node:path'
import { version as OicqVersion } from 'oicq/package.json'

import { Devices } from '@/logger'
import { formatDateDiff, formatFileSize } from '@src/utils'
import { plugins } from '@/start'
import { searchAllPlugins } from '@/plugin'

import type { Client } from 'oicq'

export const SystemMap: Record<string, string> = {
  Linux: 'Linux',
  Darwin: 'OSX',
  Windows_NT: 'Win'
}

export const ArchMap: Record<string, string> = {
  ia32: 'x86',
  arm: 'arm',
  arm64: 'arm64',
  x64: 'x64'
}

export const pkg = require(path.join(__dirname, '../../..', 'package.json'))

/** 运行状态指令处理函数 */
export async function fetchStatus(bot: Client) {
  const { cnts } = await searchAllPlugins()

  const runTime = formatDateDiff(process.uptime() * 1000, false)
  const total = os.totalmem()
  const used = total - os.freemem()
  const rss = process.memoryUsage.rss()

  const per = (param: number) => ((param / total) * 100).toFixed(1)

  const { recv_msg_cnt, sent_msg_cnt, msg_cnt_per_min } = bot.stat

  const nodeVersion = process.versions.node.split('.')[0]
  const arch = ArchMap[process.arch] || process.arch

  const message = `
〓 KiviBot 状态 〓
昵称: ${bot.nickname}
账号: ${bot.uin}
列表: ${bot.fl.size} 好友，${bot.gl.size} 群
插件: 启用 ${plugins.size} 个，共 ${cnts.all} 个
收发: ${recv_msg_cnt} p，${sent_msg_cnt} p
实时: ${msg_cnt_per_min} p/min
运行: ${runTime}
框架: v${pkg?.version || '0.0.0'}-${formatFileSize(rss)}-${per(rss)}%
协议: oicq-v${OicqVersion}-${Devices[bot.config.platform]}
系统: ${SystemMap[os.type()] || 'other'}-${arch}-node${nodeVersion}
内存: ${formatFileSize(used)}/${formatFileSize(total)}-${per(used)}%
`.trim()

  return message
}
