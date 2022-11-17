import path from 'node:path'
import fs from 'fs-extra'
import { Client } from 'oicq'

import exitWithError from '@/utils/exitWithError'
import { CWD, DataDir } from '.'

import type { Config } from 'oicq'

export interface KiviConf {
  account: number
  login_mode: 'password' | 'qrcode'
  device_mode: 'qrcode' | 'sms'
  password: string
  admins: number[]
  plugins: string[]
  oicq_config: Config
}

const configPath = path.join(CWD, 'kivi.json')

export const start = () => {
  if (!fs.existsSync(configPath)) {
    exitWithError('配置文件（kivi.json）不存在')
  }

  try {
    const { account, admins, oicq_config }: KiviConf = require(configPath)

    if (!account) {
      exitWithError('无效的配置文件（kivi.json）')
    }

    if (admins.length <= 0) {
      exitWithError('配置文件中（kivi.json）需要指定至少一个管理员')
    }

    // 未指定协议则默认使用 iPad
    oicq_config.platform ??= 5
    // 默认保存在 data/oicq 下
    oicq_config.data_dir ??= DataDir
    // 指定默认 ffmpeg 和 ffprobe 全局路径
    oicq_config.ffmpeg_path ??= 'ffmpeg'
    oicq_config.ffprobe_path ??= 'ffprobe'

    // 初始化实例
    const bot = new Client(account, oicq_config)
    const log = bot.logger.info.bind(bot.logger)

    bot.on('system.online', () => {
      // 捕获全局 Rejection，防止框架崩溃
      process.on('unhandledRejection', (e: Error) => {
        bot.sendPrivateMsg(admins[0], 'Error: ' + e.stack)
      })

      // 捕获全局 Error，防止框架崩溃
      process.on('uncaughtException', (e: Error) => {
        bot.sendPrivateMsg(admins[0], 'Error: ' + e.stack)
      })

      log('bot is online')
    })

    bot.on('message', async (e) => {
      const isMaster = admins.includes(e.sender.user_id)
      const isGroup = e.message_type === 'group'
      const isPrivateGroup = isGroup && [608391254].includes(e.group_id)

      if (isMaster || isPrivateGroup) {
        log(e.raw_message)

        if (e.raw_message === '123') {
          e.reply('123', true)
        }

        throw new Error()
      }
    })

    const handlerQRcode = () => {
      process.stdin.once('data', () => bot.login())
    }

    bot.on('system.login.qrcode', handlerQRcode).login()
  } catch {
    exitWithError('配置文件（kivi.json）不是合法的 JSON 文件')
  }
}
