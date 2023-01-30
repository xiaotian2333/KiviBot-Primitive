import { killPlugin } from './killPlugin'
import { MioPluginError } from './pluginError'
import { getPluginNameByPath } from './utils'
import { MioLogger, plugins } from '@/core'
import { colors, escapeColor, stringifyError } from '@/utils'

import type { MioPlugin } from './plugin'
import type { MioConf } from '@/core'
import type { Client } from 'movo'

/** 通过插件模块路径启用单个插件 */
export async function enablePlugin(bot: Client, mioConf: MioConf, pluginPath: string) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    MioLogger.error(msg, ...args)
  }

  MioLogger.debug('enablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    const { plugin } = (await require(pluginPath)) as { plugin: MioPlugin | undefined }

    if (plugin && plugin?.mountMioClient) {
      try {
        await plugin.mountMioClient(bot, [...mioConf.admins])

        plugins.set(pluginName, plugin)

        MioLogger.debug(`插件 ${pn} 启用成功`)

        return true
      } catch (e: any) {
        plugins.delete(pluginName)

        // 删除 require 缓存
        killPlugin(pluginPath)

        if (e instanceof MioPluginError) {
          return e.log()
        } else {
          const msg = stringifyError(e)
          error(`插件 ${pn} 启用过程中发生错误: \n${msg}`)
          return msg
        }
      }
    } else {
      plugins.delete(pluginName)

      // 删除 require 缓存
      killPlugin(pluginPath)

      const info = colors.red(`插件 ${pn} 没有导出 \`MioPlugin\` 类实例的 \`plugin\` 属性`)
      error(info)
      return escapeColor(info)
    }
  } catch (e: any) {
    plugins.delete(pluginName)

    // 删除 require 缓存
    killPlugin(pluginPath)

    if (e instanceof MioPluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)
      error(`插件 ${pn} 导入过程中发生错误: \n${msg}`)
      return msg
    }
  }
}
