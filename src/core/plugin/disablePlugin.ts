import { killPlugin } from './killPlugin'
import { MioPluginError } from './pluginError'
import { getPluginNameByPath } from './utils'
import { MioLogger } from '@/core'
import { colors, stringifyError } from '@/utils'

import type { MioPlugin } from './plugin'
import type { MioConf } from '@/core'
import type { Client } from 'movo'

/** 通过插件路径禁用单个插件  */
export async function disablePlugin(
  bot: Client,
  mioConf: MioConf,
  plugin: MioPlugin,
  pluginPath: string
) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    MioLogger.error(msg, ...args)
  }

  const debug = (msg: any, ...args: any[]) => {
    bot.logger.debug(msg, ...args)
    MioLogger.debug(msg, ...args)
  }

  MioLogger.debug('disablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    // 调用插件挂载的禁用函数
    await plugin.unmountMioClient(bot, [...mioConf.admins])

    // 删除 require 缓存
    killPlugin(pluginPath)

    debug(`插件 ${pn} 禁用成功`)

    return true
  } catch (e: any) {
    // 删除 require 缓存
    killPlugin(pluginPath)

    if (e instanceof MioPluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      error(`插件 ${pn} 禁用过程中发生错误: \n${msg}`)
      return msg
    }
  }
}
