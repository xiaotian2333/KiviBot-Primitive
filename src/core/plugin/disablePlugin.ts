import { getPluginNameByPath } from './getPluginNameByPath'
import { killPlugin } from './killPlugin'
import { KiviLogger } from '@/logger'
import { KiviPluginError } from './pluginError'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'
import type { KiviPlugin } from './plugin'

/** 通过插件路径禁用单个插件  */
export async function disablePlugin(
  bot: Client,
  kiviConf: KiviConf,
  plugin: KiviPlugin,
  pluginPath: string
) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    bot.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  KiviLogger.debug('disablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)

  try {
    // 调用插件挂载的禁用函数
    await plugin.unmountKiviBotClient(bot, [...kiviConf.admins])

    // 删除 require 缓存
    killPlugin(pluginPath)

    info(`[${pluginName}] is now off`)

    return true
  } catch (e) {
    if (e instanceof KiviPluginError) {
      e.log()
    } else {
      error(`error occurred during unmount: ${e}`)
    }
  }

  return false
}
