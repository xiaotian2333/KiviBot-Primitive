import { version as MovoVersion } from 'movo/package.json'
import os from 'node:os'

import { ShortDevices, searchAllPlugins, plugins } from '@/core'
import { formatDateDiff, formatFileSize, v } from '@/utils'

import type { Client } from 'movo'

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
export async function fetchStatus(bot: Client) {
  const { cnts } = await searchAllPlugins()

  const runTime = formatDateDiff(process.uptime() * 1000)
  const total = os.totalmem()
  const used = total - os.freemem()
  const rss = process.memoryUsage.rss()

  const per = (param: number) => ((param / total) * 100).toFixed(1)

  const { recv_msg_cnt, msg_cnt_per_min, sent_msg_cnt } = bot.stat

  const nodeVersion = process.versions.node.split('.')[0]
  const arch = ArchMap[process.arch] || process.arch

  return `
〓 keli 状态 〓
昵称: ${bot.nickname}
账号: ${bot.uin}
列表: ${bot.fl.size} 好友，${bot.gl.size} 群
插件: 启用 ${plugins.size}，共 ${cnts.all} 
消息: 收 ${recv_msg_cnt}，发 ${sent_msg_cnt}
当前: ${msg_cnt_per_min} 条/分钟
启动: ${runTime}
框架: ${v}-${formatFileSize(rss)}-${per(rss)}%
协议: movo-v${MovoVersion}-${ShortDevices[bot.config.platform]}
系统: ${SystemMap[os.type()] || '其他'}-${arch}-node${nodeVersion}
内存: ${formatFileSize(used)}/${formatFileSize(total)}-${per(used)}%
`.trim()
}
