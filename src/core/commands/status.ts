import os from 'node:os'
import dayjs from 'dayjs'

import { formatDateDiff } from '@src/utils/formatTimeDiff'
import { plugins } from '../start'
import { formatFileSize } from '@src/utils/formatFileSize'

import { segment } from 'oicq'
import { searchAllPlugins } from '../plugin/searchPlugins'
import { getQQAvatarLink } from '@src/utils/getUrl'
import path from 'node:path'

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

export async function fetchStatus(bot: Client) {
  const { cnts } = await searchAllPlugins()
  const pkg = require(path.join(__dirname, '../../..', 'package.json'))

  const startTimeMs = Date.now() - process.uptime() * 1000
  const startTimeStr = dayjs(startTimeMs).format('YYYY-MM-DD HH:mm')
  const runTime = formatDateDiff(process.uptime() * 1000)

  const total = os.totalmem()
  const used = total - os.freemem()
  const rss = process.memoryUsage.rss()

  const per = (param: number) => ((param / total) * 100).toFixed(1)
  const { recv_msg_cnt, sent_msg_cnt, msg_cnt_per_min } = bot.stat

  const date = new Date(Date.now() - os.uptime() * 1000)
  const nodeVersion = process.versions.node.split('.')[0]
  const arch = ArchMap[process.arch] || process.arch

  const message = `
昵称：${bot.nickname}
账号：${bot.uin}
列表：${bot.fl.size} 好友 - ${bot.gl.size} 群
收发：${recv_msg_cnt} 条 - ${sent_msg_cnt} 条
实时：${msg_cnt_per_min} 条/分钟
插件：启用 ${plugins.size} 个 - 共 ${cnts.all} 个
开机：${dayjs(date).format('YYYY-MM-DD HH:mm')}
启动：${startTimeStr}
运行：${runTime}
系统：${SystemMap[os.type()]}-${arch}-node${nodeVersion}
框架：${pkg.version}-${formatFileSize(rss)}-${per(rss)}%
内存：${formatFileSize(used)}/${formatFileSize(total)}-${per(used)}%
`.trim()

  return [segment.image(getQQAvatarLink(bot.uin)), message]
}
