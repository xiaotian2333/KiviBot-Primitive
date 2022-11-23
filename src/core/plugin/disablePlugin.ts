import { getPluginNameByPath } from './getPluginNameByPath'
import { killPlugin } from './killPlugin'
import { KiviLogger } from '@/log'
import { plugins } from '@/start'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'
import type { KiviPlugin } from './plugin'

/** 通过插件路径禁用单个插件  */
export async function disablePlugin(
  bot: Client,
  kiviConf: KiviConf,
  plugin: KiviPlugin,
  targetPluginPath: string
) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    bot.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  const pluginName = getPluginNameByPath(targetPluginPath)

  try {
    // 调用插件挂载的禁用函数
    await plugin.unmountKiviBotClient(bot, kiviConf.admins)

    // 删除 require 缓存
    killPlugin(targetPluginPath)

    info(`插件「${pluginName}」禁用成功`)

    return true
  } catch (e) {
    error(`插件禁用过程中发生错误: ${e}`)
  }

  // 从插件列表删除插件
  plugins.delete(pluginName)

  return false
}
