import { getPluginNameByPath } from './getPluginNameByPath'
import { killPlugin } from './killPlugin'
import { KiviPluginError } from './pluginError'
import { KiviLogger } from '@/logger'
import { colors, escapeColor, stringifyError } from '@/src/utils'
import { plugins } from '@/start'

import type { KiviPlugin } from './plugin'
import type { KiviConf } from '@/config'
import type { Client } from 'oicq'

/** 通过插件模块路径启用单个插件 */
export async function enablePlugin(bot: Client, kiviConf: KiviConf, pluginPath: string) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  KiviLogger.debug('enablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)
  const pn = colors.green(pluginName)

  try {
    const { plugin } = (await require(pluginPath)) as { plugin: KiviPlugin | undefined }

    if (plugin && plugin?.mountKiviBotClient) {
      try {
        await plugin.mountKiviBotClient(bot, [...kiviConf.admins])

        plugins.set(pluginName, plugin)

        KiviLogger.debug(`插件 ${pn} 启用成功`)

        return true
      } catch (e: any) {
        plugins.delete(pluginName)

        if (e instanceof KiviPluginError) {
          return e.log()
        } else {
          const msg = stringifyError(e)

          error(`插件 ${pn} 启用过程中发生错误: \n${msg}`)
          killPlugin(pluginPath)

          return msg
        }
      }
    } else {
      plugins.delete(pluginName)
      const info = colors.red(`插件 ${pn} 没有导出 \`KiviPlugin\` 类实例的 \`plugin\` 属性`)
      error(info)
      return escapeColor(info)
    }
  } catch (e: any) {
    plugins.delete(pluginName)

    if (e instanceof KiviPluginError) {
      return e.log()
    } else {
      const msg = stringifyError(e)

      error(`插件 ${pn} 导入过程中发生错误: \n${msg}`)
      killPlugin(pluginPath)

      return msg
    }
  }
}
