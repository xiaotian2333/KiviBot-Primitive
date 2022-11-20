import { KiviLogger } from './log'
import { KiviPluginError } from './plugin/pluginError'
import loadPlugins from './plugin/loadPlugins'

import type { Client } from 'oicq'
import type { KiviConf } from './start'

/** 监听上线事件，初始化 KiviBot */
export async function onlineHandler(this: Client, conf: KiviConf) {
  const error = (msg: any, ...args: any[]) => {
    this.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    this.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  info(`${this.nickname}(${this.uin}) 上线成功！欢迎使用 KiviBot`)

  /** 全局错误处理函数 */
  const handleGlobalError = (e: Error) => {
    if (e instanceof KiviPluginError) {
      error(`插件发生错误，来源：${e.pluginName}，报错信息: ${e.message}`)
    } else {
      error(`发生未知错误: `, e?.stack || e)
    }
  }

  // 捕获全局 Rejection，防止框架崩溃
  process.on('unhandledRejection', handleGlobalError)

  // 捕获全局 Exception，防止框架崩溃
  process.on('uncaughtException', handleGlobalError)

  // 检索并加载插件
  await loadPlugins(this, conf)
}
