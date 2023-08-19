import { handleKeliCommand } from './cmd/index.js'
import { messageHandler, noticeHandler, requestHandler } from './log/index.js'
import { KeliLogger } from './logger.js'
import { configNotice } from './notice.js'
import { PluginError, loadPlugins } from './plugin/index.js'
import { bindSendMessage } from './send.js'

import type { KeliConf } from './config.js'
import type { Client } from 'movo'

import { colors, exitWithError, stringifyError, wait } from '@/utils'

/** log flag，防止掉线重新上线触发 online 事件时重复 bind */
let hasOnline = false

/** 监听上线事件，初始化 keli */
export async function onlineHandler(this: Client, keliConf: KeliConf) {
  if (hasOnline) {
    return
  }

  hasOnline = true

  KeliLogger.info(colors.green(`${this.nickname}(${this.uin}) is online!`))

  /** 全局错误处理函数 */
  const handleGlobalError = (e: Error) => {
    if (e instanceof PluginError) {
      e.log()
    } else {
      KeliLogger.error(stringifyError(e))
    }
  }

  // 捕获全局 Rejection，防止框架崩溃
  process.on('unhandledRejection', handleGlobalError)

  // 捕获全局 Exception，防止框架崩溃
  process.on('uncaughtException', handleGlobalError)

  // 绑定发送消息，打印发送日志
  await bindSendMessage(this)

  // 监听消息，打印日志，同时处理框架命令
  this.on('message', (event) => {
    messageHandler(event)
    handleKeliCommand(event, this, keliConf)
  })

  // 监听通知、请求，打印框架日志
  this.on('notice', noticeHandler)
  this.on('request', requestHandler)

  // 设置消息通知
  configNotice(this)

  // 检索并加载插件
  const { all, cnt, npm, local, plugins } = await loadPlugins(this, keliConf)
  const pluginInfo = `${all} plugins found in total, ${local} local，${npm} npm`
  const extraInfo = plugins.length ? `, ${cnt} on: ${colors.green(plugins.join(', '))}` : ''

  KeliLogger.info(colors.cyan(`${pluginInfo}${extraInfo}`))

  // 初始化完成
  KeliLogger.info(colors.gray('keli initialized successfully'))
  KeliLogger.info(colors.gray('start to deal with message...'))

  // 上线通知，通知 Bot 主管理

  if (!keliConf.admins[0]) {
    exitWithError('main admin have to be friends with the bot')
  } else {
    const mainAdmin = this.pickFriend(keliConf.admins[0])

    if (mainAdmin) {
      await wait(600)
      const msg = `✅ 上线成功，${cnt > 0 ? `启用了 ${cnt} 个插件` : '未启用任何插件'}`
      await mainAdmin.sendMsg(msg)
    }
  }
}