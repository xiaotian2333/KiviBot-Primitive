import { killPlugin } from './killPlugin.js'
import { PluginError } from './pluginError.js'
import { getPluginNameByPath } from './utils.js'

import type { Plugin } from './plugin.js'
import type { KeliConf } from '@/core'
import type { Client } from 'movo'

import { KeliLogger, plugins } from '@/core'
import { colors, stringifyError } from '@/utils'

/** 通过插件模块路径启用单个插件 */
export async function enablePlugin(bot: Client, keliConf: KeliConf, pluginPath: string) {
  KeliLogger.debug('enablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    const { plugin } = (await require(pluginPath)) as { plugin: Plugin | undefined }

    if (plugin && plugin?.mountKeliClient) {
      try {
        await plugin.mountKeliClient(bot, [...keliConf.admins])

        plugins.set(pluginName, plugin)

        KeliLogger.debug(`plugin ${pn} has been enabled successfully`)

        return true
      } catch (e: any) {
        plugins.delete(pluginName)

        // 删除 require 缓存
        killPlugin(pluginPath)

        if (e instanceof PluginError) {
          return e.log()
        } else {
          const msg = stringifyError(e)
          KeliLogger.error(`error occurred when enabling plugin ${pn}:\n${msg}`)
          return msg
        }
      }
    } else {
      plugins.delete(pluginName)

      // 删除 require 缓存
      killPlugin(pluginPath)

      const info = `plugin ${pn} dose not export \`Plugin\` instance as \`plugin\` prop`
      KeliLogger.error(info)
      return colors.escape(info)
    }
  } catch (e: any) {
    plugins.delete(pluginName)

    // 删除 require 缓存
    killPlugin(pluginPath)

    if (e instanceof PluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      KeliLogger.error(`error ocurred when importing plugin ${pn}:\n${msg}`)
      return msg
    }
  }
}
