import { killPlugin } from './killPlugin'
import { PluginError } from './pluginError'
import { getPluginNameByPath } from './utils'
import { KeliLogger, plugins } from '@/core'
import { colors, stringifyError } from '@/utils'

import type { Plugin } from './plugin'
import type { KeliConf } from '@/core'
import type { Client } from 'movo'

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

        KeliLogger.debug(`插件 ${pn} 启用成功`)

        return true
      } catch (e: any) {
        plugins.delete(pluginName)

        // 删除 require 缓存
        killPlugin(pluginPath)

        if (e instanceof PluginError) {
          return e.log()
        } else {
          const msg = stringifyError(e)
          KeliLogger.error(`插件 ${pn} 启用过程中发生错误: \n${msg}`)
          return msg
        }
      }
    } else {
      plugins.delete(pluginName)

      // 删除 require 缓存
      killPlugin(pluginPath)

      const info = `插件 ${pn} 没有导出 \`Plugin\` 类实例的 \`plugin\` 属性`
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
      KeliLogger.error(`插件 ${pn} 导入过程中发生错误: \n${msg}`)
      return msg
    }
  }
}
