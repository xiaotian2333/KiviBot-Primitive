import os from 'node:os'
import { version as OicqVersion } from 'oicq/package.json'

import { Devices } from '@/logger'
import { formatDateDiff, formatFileSize } from '@src/utils'
import { MessagCounts } from '@/bindSendMessage'
import { pkg, plugins } from '@/start'
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

/** 运行状态指令处理函数 */
export async function fetchStatus(bot: Client, isFirst = false) {
  const { cnts } = await searchAllPlugins()

  const runTime = formatDateDiff(process.uptime() * 1000, false)
  const total = os.totalmem()
  const used = total - os.freemem()
  const rss = process.memoryUsage.rss()

  const per = (param: number) => ((param / total) * 100).toFixed(1)

  const { recv_msg_cnt, msg_cnt_per_min } = bot.stat

  const nodeVersion = process.versions.node.split('.')[0]
  const arch = ArchMap[process.arch] || process.arch

  // TODO: 待 oicq2 修复已发送消息数，目前自己实现计数

  const message = `
〓 KiviBot Status 〓
nickname: ${bot.nickname}
account: ${bot.uin}
list: ${bot.fl.size} friends, ${bot.gl.size} groups
plugin: ${plugins.size} on, ${cnts.all} in total
message: ${recv_msg_cnt} R, ${MessagCounts.value} S
current: ${msg_cnt_per_min} p/min
duration: ${!runTime || isFirst ? 'from now on' : runTime}
frame: ${pkg?.version || 'unknown'}-${formatFileSize(rss)}-${per(rss)}%
protocal: oicq-v${OicqVersion}-${Devices[bot.config.platform]}
system: ${SystemMap[os.type()] || 'other'}-${arch}-node${nodeVersion}
memory: ${formatFileSize(used)}/${formatFileSize(total)}-${per(used)}%
`.trim()

  return message
}
