import { createClient } from 'oicq'
import crypto from 'node:crypto'
import fs, { ensureDirSync } from 'fs-extra'

import { ConfigPath, LogDir, OicqDataDir, PluginDataDir, PluginDir } from './path'
import { deviceHandler, errorHandler, qrCodeHandler, sliderHandler } from './login'
import { Devices, KiviLogger, redirectLog } from './log'
import { handleKiviCommand } from './commands'
import { kiviConf } from './config'
import { messageHandler, requestHandler, noticeHandler, offlineHandler } from './logs'
import { onlineHandler } from './online'
import { colors, LOGO, exitWithError } from '@src/utils'

import type { KiviPlugin } from './plugin'
import type { KiviConf } from './config'

export const plugins: Map<string, KiviPlugin> = new Map()

/** 启动框架 */
export const start = () => {
  // 打印 KiviBot logo
  console.log(colors.blue(LOGO))

  if (!fs.existsSync(ConfigPath)) {
    exitWithError('配置文件 `kivi.json` 不存在')
  }

  /** 捕获 Ctrl C 中断退出 */
  process.on('SIGINT', () => {
    process.stdout.write(colors.yellow('\n已成功退出 KiviBot'))
    process.exit(0)
  })

  try {
    // 读取框架账号配置文件 `kivi.json`
    const conf: KiviConf = require(ConfigPath)
    const { log_level, oicq_config } = conf

    if (!conf.account) {
      exitWithError('无效的配置文件 `kivi.json` ')
    }

    if (conf.admins.length <= 0) {
      exitWithError('配置文件 `kivi.json` 需要指定至少一个管理员')
    }

    // 载入配置到内存
    Object.assign(kiviConf, conf)

    oicq_config.platform ??= 5

    oicq_config.data_dir = OicqDataDir
    oicq_config.log_level ??= 'info'

    oicq_config.ffmpeg_path ??= 'ffmpeg'
    oicq_config.ffprobe_path ??= 'ffprobe'

    // 重定向日志，oicq 的日志输出到日志文件，KiviBot 的日志输出到 console
    redirectLog(log_level, oicq_config, kiviConf.account)

    KiviLogger.info(colors.cyan('欢迎使用 KiviBot，使用文档：https://kivibot.com'))
    KiviLogger.info(colors.gray(`使用配置文件：${ConfigPath}`))

    // 确保 KiviBot 框架相关目录存在
    ensureDirSync(LogDir)
    ensureDirSync(PluginDir)
    ensureDirSync(PluginDataDir)

    const protocol = Devices[oicq_config.platform] || '未知'
    const loginMessage = `开始登录账号：${kiviConf.account}，使用协议：${protocol}`

    KiviLogger.info(colors.gray(loginMessage))

    // 初始化实例
    const bot = createClient(kiviConf.account, {
      ...oicq_config,
      // 未指定协议时，默认使用 iPad 协议作为 oicq 登录协议
      platform: oicq_config.platform ?? 5,
      // ociq 数据及缓存保存在 data/oicq 下
      data_dir: oicq_config.data_dir ?? OicqDataDir,
      log_level: oicq_config.log_level ?? 'info',
      // 指定默认 ffmpeg 和 ffprobe 命令为全局路径
      ffmpeg_path: oicq_config.ffmpeg_path ?? 'ffmpeg',
      ffprobe_path: oicq_config.ffprobe_path ?? 'ffprobe'
    })

    // 取消监听函数个数限制
    bot.setMaxListeners(Infinity)

    // 监听消息，打印日志，同时处理框架命令
    bot.on('message', (event) => {
      messageHandler(event)
      handleKiviCommand(event, bot, kiviConf)
    })

    // 监听上线事件
    bot.on('system.online', onlineHandler.bind(bot, kiviConf))

    // 监听设备锁、滑块和登录错误的事件
    bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
    bot.on('system.login.slider', ({ url }) => sliderHandler.call(bot, { isFirst: true, url }))
    bot.on('system.login.error', errorHandler)

    // 监听下线事件
    bot.on('system.offline', offlineHandler)

    // 监听通知、请求，打印框架日志
    bot.on('notice', noticeHandler)
    bot.on('request', requestHandler)

    // 通过配置文件里指定的模式登录账号
    if (conf.login_mode === 'qrcode') {
      bot.on('system.login.qrcode', qrCodeHandler).login()
    } else {
      const plainPwd = Buffer.from(conf.password, 'base64').toString()
      const md5Pwd = crypto.createHash('md5').update(plainPwd).digest()
      bot.login(md5Pwd)
    }
  } catch (e) {
    KiviLogger.debug(e)
    exitWithError('配置文件 `kivi.json` 不符合 JSON 格式')
  }
}
