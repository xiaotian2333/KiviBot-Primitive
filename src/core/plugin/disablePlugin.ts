import { killPlugin } from './killPlugin'
import { PluginError } from './pluginError'
import { getPluginNameByPath } from './utils'
import { KeliLogger } from '@/core'
import { colors, stringifyError } from '@/utils'

import type { Plugin } from './plugin'
import type { KeliConf } from '@/core'
import type { Client } from 'movo'

/** 通过插件路径禁用单个插件  */
export async function disablePlugin(
  bot: Client,
  keliConf: KeliConf,
  plugin: Plugin,
  pluginPath: string
) {
  KeliLogger.debug('disablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    // 调用插件挂载的禁用函数
    await plugin.unmountKeliClient(bot, [...keliConf.admins])

    // 删除 require 缓存
    killPlugin(pluginPath)

    KeliLogger.debug(`插件 ${pn} 禁用成功`)

    return true
  } catch (e: any) {
    // 删除 require 缓存
    killPlugin(pluginPath)

    if (e instanceof PluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      KeliLogger.error(`插件 ${pn} 禁用过程中发生错误: \n${msg}`)
      return msg
    }
  }
}
