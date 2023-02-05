import { bindSendMessage } from './bindSendMessage'
import { handleKeliCommand } from './commands'
import { KeliLogger } from './logger'
import { messageHandler, noticeHandler, requestHandler } from './logs'
import { configNotice } from './notice'
import { PluginError, loadPlugins } from './plugin'
import { colors, stringifyError, wait } from '@/utils'

import type { KeliConf } from './config'
import type { Client } from 'movo'

/** log flag，防止掉线重新上线触发 online 事件时重复 bind */
let hasOnline = false

/** 监听上线事件，初始化 keli */
export async function onlineHandler(this: Client, keliConf: KeliConf) {
  if (hasOnline) {
    return
  }

  hasOnline = true

  KeliLogger.info(colors.green(`${this.nickname}(${this.uin}) 上线成功！`))

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

  const pluginInfo = `共检索到 ${all} 个插件 (${local} 个本地，${npm} 个 npm)`

  KeliLogger.info(colors.cyan(`${pluginInfo}, 启用 ${cnt} 个：${colors.green(plugins.join(', '))}`))

  // 初始化完成
  KeliLogger.info(colors.gray('框架初始化完成'))
  KeliLogger.info(colors.gray('开始处理消息...'))

  // 上线通知，通知 Bot 主管理

  if (!keliConf.admins[0]) {
    KeliLogger.error(colors.red('主管理员必须添加 Bot 为好友，否则无法正常控制 Bot 和发送消息通知'))
  } else {
    const mainAdmin = this.pickFriend(keliConf.admins[0])

    await wait(600)
    await mainAdmin.sendMsg(`上线成功，启用了 ${cnt} 个插件\n发送 /help 查看 keli 帮助`)
  }
}
