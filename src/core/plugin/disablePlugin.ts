import { getPluginNameByPath } from './getPluginNameByPath'
import { killPlugin } from './killPlugin'
import { KiviPluginError } from './pluginError'
import { KiviLogger } from '@/logger'
import { colors, stringifyError } from '@/src/utils'

import type { KiviPlugin } from './plugin'
import type { KiviConf } from '@/config'
import type { Client } from 'oicq'

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

  const debug = (msg: any, ...args: any[]) => {
    bot.logger.debug(msg, ...args)
    KiviLogger.debug(msg, ...args)
  }

  KiviLogger.debug('disablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    // 调用插件挂载的禁用函数
    await plugin.unmountKiviBotClient(bot, [...kiviConf.admins])

    // 删除 require 缓存
    killPlugin(pluginPath)

    debug(`插件 ${pn} 禁用成功`)

    return true
  } catch (e: any) {
    if (e instanceof KiviPluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      error(`插件 ${pn} 禁用过程中发生错误: \n${msg}`)
      return msg
    }
  }
}
