import fs from 'fs-extra'
import { createClient } from 'icqq'

import { keliConf } from './config'
import { offlineHandler } from './log'
import { Devices, KeliLogger, redirectLog } from './logger'
import { bindLoginEvent, qrCodeHandler } from './login'
import { onlineHandler } from './online'

import type { KeliConf } from './config'
import type { Plugin } from './plugin'

import { ConfigPath, LogDir, OicqDataDir, PluginDataDir, PluginDir } from '@/path'
import { colors, exitWithError, stringifyError, v } from '@/utils'

/** 当前缓存中已载入并启用的插件 map */
export const plugins: Map<string, Plugin> = new Map()

/** 通过 keli.json 配置文件启动框架 */
export function start() {
  // 设置终端标题
  process.title = `keli v${v}`

  // 打印 keli 版本
  console.log(colors.cyan(`\nkeli v${v}\n`))

  if (!fs.existsSync(ConfigPath)) {
    exitWithError('keli.json is not exist')
  }

  try {
    // 读取框架账号配置文件 keli.json
    const conf: KeliConf = require(ConfigPath)

    // 载入配置到内存
    Object.assign(keliConf, conf)

    console.log(`welcome to keli，just run の bot\n`)

    const { log_level = 'info', oicq_config = {} } = keliConf

    if (!keliConf?.account) {
      exitWithError('keli.json is invalid')
    }

    if (!keliConf?.admins || keliConf?.admins?.length <= 0) {
      exitWithError('at least add one admin in keli.json')
    }

    // 缺省 oicq 配置

    // 未指定协议时，默认使用 iPad 协议作为 oicq 登录协议
    oicq_config.platform = oicq_config?.platform ?? 5
    // oicq 数据及缓存保存在 data/oicq 下
    oicq_config.data_dir = OicqDataDir
    // oicq 默认日志等级为 info
    oicq_config.log_level = oicq_config?.log_level ?? 'info'
    // 指定默认 ffmpeg 和 ffprobe 命令为全局路径
    oicq_config.ffmpeg_path = oicq_config?.ffmpeg_path || 'ffmpeg'
    oicq_config.ffprobe_path = oicq_config?.ffprobe_path || 'ffprobe'

    // 重定向日志，oicq 的日志输出到日志文件，keli 的日志输出到 console
    redirectLog(log_level, oicq_config, keliConf.account)

    // 确保 keli 框架相关目录存在
    fs.ensureDirSync(LogDir)
    fs.ensureDirSync(PluginDir)
    fs.ensureDirSync(PluginDataDir)

    // 终端标题加上账号
    const protocol = Devices[oicq_config.platform] || 'unknown'
    process.title = `keli v${v} ${keliConf.account}-${protocol}`

    KeliLogger.info(colors.gray(`using config: ${ConfigPath}`))
    KeliLogger.info(colors.gray(`using protocol: ${protocol}`))
    KeliLogger.info(colors.gray(`ready to login ${keliConf.account}`))
    KeliLogger.info(colors.gray(`looking for available servers...`))

    // 初始化实例
    const bot = createClient(oicq_config)

    // 监听上线事件
    bot.on('system.online', onlineHandler.bind(bot, keliConf))

    // 监听设备锁、滑块和登录错误的事件
    bindLoginEvent(bot, conf)

    // 监听下线事件
    bot.on('system.offline', offlineHandler)

    // 通过配置文件里指定的模式登录账号
    if (conf.login_mode === 'qrcode') {
      bot.on('system.login.qrcode', qrCodeHandler).login()
    } else {
      if (conf.password) {
        bot.login(keliConf.account, Buffer.from(conf.password, 'hex'))
      } else {
        exitWithError('password in keli.json cannot be empty')
      }
    }
  } catch (e) {
    KeliLogger.error(stringifyError(e))

    exitWithError('keli.json is invalid')
  }
}
