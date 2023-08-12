import { killPlugin } from './killPlugin.js'
import { PluginError } from './pluginError.js'
import { getPluginNameByPath } from './utils.js'

import type { Plugin } from './plugin.js'
import type { KeliConf } from '@/core'
import type { Client } from 'movo'

import { KeliLogger } from '@/core'
import { colors, stringifyError } from '@/utils'

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

    KeliLogger.debug(`plugin ${pn} has been disabled successfully`)

    return true
  } catch (e: any) {
    // 删除 require 缓存
    killPlugin(pluginPath)

    if (e instanceof PluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      KeliLogger.error(`error occurred when disabling plugin ${pn}:\n${msg}`)
      return msg
    }
  }
}
