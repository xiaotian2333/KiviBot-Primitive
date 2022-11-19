import dayjs from 'dayjs'
import log4js from 'log4js'
import path from 'node:path'

import { LogDir } from '.'

import type { Config } from 'oicq'

// 1:安卓手机 2:aPad 3:安卓手表 4:MacOS 5:iPad
export const devices = ['', 'Android', 'aPad', 'aWatch', 'Mac', 'iPad']

// 添加自定义 log4js Layout布局：Kivi
log4js.addLayout('Kivi', (config) => {
  const { qq, platform, oicq = false } = config

  // oicq 日志输出到日志文件（可选关闭） logs/KiviBot_YYYY-MM-DD_HH-mm-ss.log
  if (oicq) {
    return (info) => {
      const now = dayjs(info.startTime).format(`YYYY-MM-DD HH:mm:ss:SSS`)
      return `[${now}] [${info.level}] [${qq}-${devices[platform]}] ${info.data}`
    }
  }

  // KiviBot 框架日志输出到控制台（可选关闭）
  return (info) => {
    const now = dayjs(info.startTime).format('M-D HH:mm:ss')
    return `[${now}] [${qq}-${devices[platform]}] ${info.data}`
  }
})

/** 重定向 oicq 日志输出到日志文件 */
export function redirectLog(kiviLogLevel = 'info', oicq_config: Config, account: number) {
  const { platform = 5, log_level: oicqLogLevel } = oicq_config

  // 定义输出文件名和路径
  const now = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  const filename = `KiviBot_${now}_${account}_${devices[platform]}`
  const logFilePath = path.join(LogDir, `${filename}.log`)
  const errorFilePath = path.join(LogDir, `${filename}_error.log`)

  // 使用自定义的 Kivi Layout
  const layout = {
    platform,
    type: 'Kivi',
    qq: 536596616
  }

  // 配置 log4js
  log4js.configure({
    appenders: {
      console: {
        layout,
        type: 'stdout'
      },
      log_file: {
        type: 'file',
        filename: logFilePath,
        layout: {
          ...layout,
          oicq: true
        }
      },
      _error_file: {
        type: 'file',
        filename: errorFilePath,
        layout: {
          ...layout,
          oicq: true
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
      Kivi: {
        appenders: ['console'],
        level: kiviLogLevel
      }
    }
  })
}
