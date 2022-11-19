import { createClient } from 'oicq'
import crypto from 'node:crypto'
import fs, { ensureDirSync } from 'fs-extra'
import path from 'node:path'

import { CWD, LogDir, OicqDataDir, PluginDataDir, PluginDir } from '.'
import { handleKiviCommand } from './commands'
import { handleOnline } from './online'
import { LOGO } from '@src/utils/logo'
import { redirectLog } from './log'
import colors from '@src/utils/colors'
import deviceHandler from './login/deviceHandler'
import errorListener from './login/errorHandler'
import exitWithError from '@src/utils/exitWithError'
import qrCodeHandler from './login/qrCodeHandler'
import sliderListener from './login/sliderHandler'

import type { Config } from 'oicq'
import type { KiviPlugin } from '.'

export type MainAdmin = number
export type AdminArray = [MainAdmin, ...number[]]

/** KiviBot 配置文件 */
export interface KiviConf {
  account: number
  login_mode: 'password' | 'qrcode'
  device_mode: 'qrcode' | 'sms'
  password: string
  admins: AdminArray
  plugins: string[]
  log_level: Config['log_level']
  oicq_config: Config
}

const configPath = path.join(CWD, 'kivi.json')

export const plugins: Map<string, KiviPlugin> = new Map()

/** 启动框架 */
export const start = () => {
  // 打印 logo
  console.log(colors.blue(LOGO))

  if (!fs.existsSync(configPath)) {
    exitWithError('配置文件 `kivi.json` 不存在')
  }

  try {
    // 读取配置文件
    const conf: KiviConf = require(configPath)
    const { log_level, oicq_config } = conf

    if (!conf.account) {
      exitWithError('无效的配置文件 `kivi.json` ')
    }

    if (conf.admins.length <= 0) {
      exitWithError('配置文件 `kivi.json` 需要指定至少一个管理员')
    }

    // 未指定协议时，默认使用 iPad 协议作为 oicq 登录协议
    oicq_config.platform ??= 5
    // ociq 数据及缓存默认保存在 data/oicq 下
    oicq_config.data_dir ??= OicqDataDir
    // ociq 数据及缓存默认保存在 data/oicq 下
    oicq_config.log_level ??= 'info'
    // 指定默认 ffmpeg 和 ffprobe 命令为全局路径
    oicq_config.ffmpeg_path ??= 'ffmpeg'
    oicq_config.ffprobe_path ??= 'ffprobe'

    // 重定向日志，oicq 的日志输出到日志文件，KiviBot 的日志输出到 console
    redirectLog(log_level, oicq_config, conf.account)

    // 确保 KiviBot 框架相关目录存在
    ensureDirSync(LogDir)
    ensureDirSync(PluginDir)
    ensureDirSync(PluginDataDir)

    // 初始化实例
    const bot = createClient(conf.account, oicq_config)

    // 监听处理框架命令
    bot.on('message', (event) => handleKiviCommand(event, bot, conf))

    // 监听上线事件
    bot.on('system.online', () => handleOnline(bot, conf))

    // 监听设备锁、滑块和登录错误的事件
    bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
    bot.on('system.login.slider', sliderListener)
    bot.on('system.login.error', errorListener)

    // 通过配置文件里指定的模式登录账号
    if (conf.login_mode === 'qrcode') {
      bot.on('system.login.qrcode', qrCodeHandler).login()
    } else {
      const plainPwd = Buffer.from(conf.password, 'base64').toString()
      const md5Pwd = crypto.createHash('md5').update(plainPwd).digest()
      bot.login(md5Pwd)
    }
  } catch (e) {
    console.log(e)
    exitWithError('配置文件 `kivi.json` 不符合 JSON 格式')
  }
}
