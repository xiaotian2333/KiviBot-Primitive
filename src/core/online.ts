import { plugins } from './plugin'
import { KiviPluginError } from './plugin/pluginError'

import type { Client } from 'oicq'
import type { AdminArray } from './start'

export async function handleOnline(bot: Client, admins: AdminArray) {
  // 日志函数
  const log = bot.logger.info.bind(bot.logger)
  const error = bot.logger.error.bind(bot.logger)

  /** 全局错误处理函数 */
  const handleGlobalError = (e: Error) => {
    if (e instanceof KiviPluginError) {
      error(`插件发生错误，来源：${e.pluginName}，报错信息: ${e.message}`)
    } else {
      error(`发生未知错误: `, e.stack)
    }
  }

  // 捕获全局 Rejection，防止框架崩溃
  process.on('unhandledRejection', handleGlobalError)

  // 捕获全局 Exception，防止框架崩溃
  process.on('uncaughtException', handleGlobalError)

  log('开始准备加载插件...')

  try {
    const plugin = (await import('./plugin/demoPlugin')).default
    plugins.add(plugin)
    try {
      plugin.mountKiviBotClient(bot, admins)
    } catch (e) {
      error(`插件挂载（onMounted）过程中发生错误: `, e)
    }
  } catch (e) {
    error(`插件导入（import）过程中发生错误: `, e)
  }

  log('插件加载完毕')
}
