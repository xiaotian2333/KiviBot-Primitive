import { createClient } from 'oicq'
import fs from 'fs-extra'

import { bindLoginEvent, qrCodeHandler } from './login'
import { colors, LOGO, exitWithError, notice, stringifyError, md5 } from '@src/utils'
import { ConfigPath, LogDir, OicqDataDir, PluginDataDir, PluginDir } from './path'
import { Devices, KiviLogger, redirectLog } from './logger'
import { kiviConf } from './config'
import { offlineHandler } from './logs'
import { onlineHandler } from './online'

import type { KiviPlugin } from './plugin'
import type { KiviConf } from './config'

/** 当前缓存中已载入并启用的插件 map */
export const plugins: Map<string, KiviPlugin> = new Map()

/** 框架的 package.json 描述信息 */
export const pkg = require('../../package.json')

/** 通过 `kivi.json` 配置文件启动框架 */
export function start() {
  // 设置终端标题
  process.title = `KiviBot ${pkg.version} `

  // 打印 KiviBot logo
  console.log(`\n${colors.cyan(LOGO)}\n`)

  if (!fs.existsSync(ConfigPath)) {
    exitWithError('配置文件 `kivi.json` 不存在')
  }

  /** 捕获 Ctrl C 中断退出 */
  process.on('SIGINT', () => {
    notice.success(colors.yellow('已退出 KiviBot'), true)
    process.exit(0)
  })

  try {
    // 读取框架账号配置文件 `kivi.json`
    const conf: KiviConf = require(ConfigPath)

    // 载入配置到内存
    Object.assign(kiviConf, conf)

    // 终端标题加上账号
    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`

    console.log(`欢迎使用 KiviBot，轻量、高效、跨平台\n`)

    console.log('使用文档: ' + colors.green('https://beta.kivibot.com'))
    console.log('框架版本: ' + colors.green(`@kivibot/core ${pkg.version}`))
    console.log('配置文件: ' + colors.green(`${ConfigPath}\n`))

    const { log_level = 'info', oicq_config = {} } = kiviConf

    if (!kiviConf?.account) {
      exitWithError('无效的配置文件：`kivi.json`')
    }

    if (!kiviConf?.admins || kiviConf?.admins?.length <= 0) {
      exitWithError('配置文件 `kivi.json` 中至少配置一个主管理员')
    }

    // 缺省 oicq 配置

    // 未指定协议时，默认使用 iPad 协议作为 oicq 登录协议
    oicq_config.platform = oicq_config?.platform ?? 5
    // ociq 数据及缓存保存在 data/oicq 下
    oicq_config.data_dir = OicqDataDir
    // oicq 默认日志等级为 info
    oicq_config.log_level = oicq_config?.log_level ?? 'info'
    // 指定默认 ffmpeg 和 ffprobe 命令为全局路径
    oicq_config.ffmpeg_path = oicq_config?.ffmpeg_path || 'ffmpeg'
    oicq_config.ffprobe_path = oicq_config?.ffprobe_path || 'ffprobe'

    // 重定向日志，oicq 的日志输出到日志文件，KiviBot 的日志输出到 console
    redirectLog(log_level, oicq_config, kiviConf.account)

    // 确保 KiviBot 框架相关目录存在
    fs.ensureDirSync(LogDir)
    fs.ensureDirSync(PluginDir)
    fs.ensureDirSync(PluginDataDir)

    const protocol = Devices[oicq_config.platform] || '未知'

    KiviLogger.info(colors.gray(`使用 ${protocol} 作为 Bot 登录协议`))
    KiviLogger.info(colors.gray(`开始登录 Bot 账号 ${kiviConf.account}...`))
    KiviLogger.info(colors.gray(`正在查找可用登录服务器...`))

    // 初始化实例
    const bot = createClient(kiviConf.account, oicq_config)

    // 取消监听函数个数限制
    bot.setMaxListeners(Infinity)

    // 监听上线事件
    bot.on('system.online', onlineHandler.bind(bot, kiviConf))

    // 监听设备锁、滑块和登录错误的事件
    bindLoginEvent(bot, conf)

    // 监听下线事件
    bot.on('system.offline', offlineHandler)

    // 通过配置文件里指定的模式登录账号
    if (conf.login_mode === 'qrcode') {
      bot.on('system.login.qrcode', qrCodeHandler).login()
    } else {
      const plainPwd = Buffer.from(conf.password || '', 'base64').toString()
      bot.login(md5(plainPwd))
    }
  } catch (e) {
    KiviLogger.error(stringifyError(e))

    exitWithError('无效的配置文件：`kivi.json`')
  }
}
