import dayjs from 'dayjs'
import log4js from 'log4js'
import path from 'node:path'

import { LogDir } from './path'
import { colors } from '@src/utils'

import type { Config } from 'oicq'

// 1:安卓手机 2:aPad 3:安卓手表 4:MacOS 5:iPad
export const Devices = ['', 'Android', 'aPad', 'aWatch', 'Mac', 'iPad']

export const KiviLogger = log4js.getLogger('kivi')
export const PluginLogger = log4js.getLogger('plugin')

export const LogTypeMap: Record<string, string> = {
  all: 'gray',
  mark: 'gray',
  trace: 'white',
  debug: 'blue',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta',
  off: 'magenta'
}

export const LogChineseMap: Record<string, string> = {
  all: '所有',
  mark: '提示',
  trace: '追踪',
  debug: '调试',
  info: '信息',
  warn: '警告',
  error: '错误',
  fatal: '致命',
  off: '关闭'
}

// 添加自定义 log4js Layout布局：kivi
log4js.addLayout('kivi', (config) => {
  const { qq, platform, target = 'kivi' } = config

  // oicq 日志输出到日志文件（可选关闭） logs/KiviBot_YYYY-MM-DD_HH-mm-ss.log
  if (target === 'oicq') {
    return (info) => {
      const now = dayjs(info.startTime).format(`YYYY-MM-DD HH:mm:ss:SSS`)
      return `[${now}] [${info.level.levelStr}] [${qq}-${Devices[platform]}] ${info.data}`
    }
  }

  // KiviBot 框架日志输出到控制台（包括插件，可选关闭）
  return (info) => {
    const level = info.level.levelStr.toLowerCase()
    const now = dayjs(info.startTime).format(`MM-DD HH:mm:ss`)
    const color = LogTypeMap[level] as keyof typeof colors
    const type = target === 'kivi' ? 'KIVI' : 'PLUGIN'
    const head = colors[color](`[${now}] [${type}] [${LogChineseMap[level]}]`)
    return head + colors.gray(' - ') + info.data
  }
})

/** 重定向 oicq 日志输出到日志文件 */
export function redirectLog(kiviLogLevel = 'info', oicq_config: Config, account: number) {
  const { platform = 5, log_level: oicqLogLevel } = oicq_config

  // 定义输出文件名和路径
  const now = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  const filename = `KiviBot_${now}_${account}_${Devices[platform]}`
  const logFilePath = path.join(LogDir, `${filename}.log`)
  const errorFilePath = path.join(LogDir, `${filename}_error.log`)

  // 使用自定义的 Kivi Layout
  const layout = {
    platform,
    type: 'kivi',
    qq: 536596616
  }

  // 配置 log4js
  log4js.configure({
    appenders: {
      kivi: {
        layout,
        type: 'stdout'
      },
      plugin: {
        type: 'stdout',
        layout: {
          ...layout,
          target: 'pluin'
        }
      },
      log_file: {
        type: 'file',
        filename: logFilePath,
        layout: {
          ...layout,
          target: 'oicq'
        }
      },
      _error_file: {
        type: 'file',
        filename: errorFilePath,
        layout: {
          ...layout,
          target: 'oicq'
        }
      },
      error_file: {
        type: 'logLevelFilter',
        appender: '_error_file',
        level: 'warn'
      }
    },
    categories: {
      default: {
        appenders: ['log_file', 'error_file'],
        level: oicqLogLevel as string
      },
      kivi: {
        appenders: ['kivi'],
        level: kiviLogLevel
      },
      plugin: {
        appenders: ['plugin'],
        level: kiviLogLevel
      }
    }
  })
}
