import { bindSendMessage } from './bindSendMessage'
import { colors, wait } from '@src/utils'
import { configNotice } from './notice'
import { handleKiviCommand } from './commands'
import { KiviLogger, PluginLogger } from './logger'
import { KiviPluginError, loadPlugins } from './plugin'
import { messageHandler, noticeHandler, requestHandler } from './logs'

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

  info(colors.green(`${this.nickname}(${this.uin}) 上线成功！发送 /help 指令查看用法。`))

  /** 全局错误处理函数 */
  const handleGlobalError = (e: Error) => {
    if (e instanceof KiviPluginError) {
      PluginLogger.error(`[${e.pluginName}] ${e.message}`)
    } else {
      error(e?.message || e?.stack || JSON.stringify(e))
    }
  }

  // 捕获全局 Rejection，防止框架崩溃
  process.on('unhandledRejection', handleGlobalError)

  // 捕获全局 Exception，防止框架崩溃
  process.on('uncaughtException', handleGlobalError)

  // 绑定发送消息，打印发送日志
  bindSendMessage(this)

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

  info(colors.cyan(`共检索到 ${all} 个插件 (${local} 个本地，${npm} 个 npm), 启用 ${cnt} 个`))

  // 初始化完成
  KiviLogger.info(colors.gray('框架初始化完成'))
  KiviLogger.info(colors.gray('开始处理消息...'))

  // 上线通知，通知 Bot 主管理

  if (!kiviConf.admins[0]) {
    error(colors.red('主管理员必须添加 Bot 为好友，否则无法正常控制 Bot 和发送消息通知'))
  } else {
    const mainAdmin = this.pickFriend(kiviConf.admins[0])

    await wait(600)
    await mainAdmin.sendMsg('上线成功，发送 /help 查看帮助')
  }
}
