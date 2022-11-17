import path from 'node:path'
import fs from 'fs-extra'
import { createClient } from 'oicq'

import { CWD, OicqDataDir } from '.'
import { KiviPluginError } from './plugin'
import exitWithError from '@/utils/exitWithError'
import plugin from './plugin/demoPlugin'

import type { Config } from 'oicq'
import type { KiviPlugin } from './plugin'

export type MainAdmin = number
export type AdminArray = [MainAdmin, ...number[]]

export interface KiviConf {
  account: number
  login_mode: 'password' | 'qrcode'
  device_mode: 'qrcode' | 'sms'
  password: string
  admins: AdminArray
  plugins: string[]
  oicq_config: Config
}

const configPath = path.join(CWD, 'kivi.json')

const plugins = new Set<KiviPlugin>()

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
    oicq_config.data_dir ??= OicqDataDir
    // 指定默认 ffmpeg 和 ffprobe 全局路径
    oicq_config.ffmpeg_path ??= 'ffmpeg'
    oicq_config.ffprobe_path ??= 'ffprobe'

    // 初始化实例
    const bot = createClient(account, oicq_config)
    const log = bot.logger.info.bind(bot.logger)
    const error = bot.logger.error.bind(bot.logger)

    bot.on('system.online', async () => {
      // 捕获全局 Rejection，防止框架崩溃
      process.on('unhandledRejection', (e: Error) => {
        if (e instanceof KiviPluginError) {
          error(`插件发生错误，来源：${e.pluginName}，报错信息: ${e.message}`)
        } else {
          error(`发生未知错误: `, e.stack)
        }
      })

      // 捕获全局 Exception，防止框架崩溃
      process.on('uncaughtException', (e: Error) => {
        if (e instanceof KiviPluginError) {
          error(`插件发生错误，来源：${e.pluginName}，报错信息: ${e.message}`)
        } else {
          error(`发生未知错误: `, e.stack)
        }
      })

      log('正在加载插件...')

      try {
        const plugin = (await import('./plugin/demoPlugin')).default
        plugins.add(plugin)
        try {
          plugin._mount(bot, admins)
        } catch (e) {
          error(`插件挂载（onMounted）过程中发生错误: `, e)
        }
      } catch (e) {
        error(`插件导入过程中发生错误: `, e)
      }

      log('插件加载完毕')
    })

    bot.on('message', async (e) => {
      const isMaster = admins.includes(e.sender.user_id)
      const isGroup = e.message_type === 'group'
      const isPrivateGroup = isGroup && [608391254].includes(e.group_id)

      if (isMaster || isPrivateGroup) {
        // log(e.raw_message)

        if (e.raw_message === '123') {
          e.reply('123', true)
        }

        if (e.raw_message === '#卸载插件') {
          plugins.forEach((plugin) => plugin._unmount(bot, admins))
        }

        // throw new Error()
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
