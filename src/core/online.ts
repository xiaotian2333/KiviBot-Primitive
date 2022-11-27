import { colors } from '@src/utils'
import { handleKiviCommand } from './commands'
import { KiviLogger } from './logger'
import { KiviPluginError, loadPlugins } from './plugin'
import { messageHandler, noticeHandler, requestHandler } from './logs'
import { configNotice } from './notice'

import type { Client } from 'oicq'
import type { KiviConf } from './config'

/** 监听上线事件，初始化 KiviBot */
export async function onlineHandler(this: Client, kiviConf: KiviConf) {
  const error = (msg: any, ...args: any[]) => {
    this.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    this.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  info(colors.green(`${this.nickname}(${this.uin}) 上线成功！`))

  /** 全局错误处理函数 */
  const handleGlobalError = (e: Error) => {
    if (e instanceof KiviPluginError) {
      error(`插件发生错误，来源：${e.pluginName}，报错信息: ${e.message}`)
    } else {
      error(e?.message || e?.stack || JSON.stringify(e))
    }
  }

  // 捕获全局 Rejection，防止框架崩溃
  process.on('unhandledRejection', handleGlobalError)

  // 捕获全局 Exception，防止框架崩溃
  process.on('uncaughtException', handleGlobalError)

  // 监听消息，打印日志，同时处理框架命令
  this.on('message', (event) => {
    messageHandler(event)
    handleKiviCommand(event, this, kiviConf)
  })

  // 监听通知、请求，打印框架日志
  this.on('notice', noticeHandler)
  this.on('request', requestHandler)

  // 设置消息通知
  configNotice(this)

  // 检索并加载插件
  const { all, cnt, npm, local } = await loadPlugins(this, kiviConf)
  info(colors.cyan(`检索到 ${all} 个插件 (${npm}/${local})，成功启用 ${cnt} 个`))

  // 上线通知，通知机器人主管理
  const mainAdmin = this.pickFriend(kiviConf.admins[0])

  if (!mainAdmin) {
    error(colors.red('主管理员必须添加机器人为好友才能进行控制'))
  } else {
    mainAdmin.sendMsg(`Hello KiviBot`)
  }

  // 初始化完成
  KiviLogger.info(colors.gray('框架初始化完成，开始处理消息...'))
}
