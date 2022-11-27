import { colors } from '@src/utils'
import { getPluginNameByPath } from './getPluginNameByPath'
import { KiviLogger } from '@/logger'
import { KiviPluginError } from './pluginError'
import { plugins } from '@/start'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'
import type { KiviPlugin } from './plugin'

/** 通过插件模块路径启用单个插件 */
export async function enablePlugin(bot: Client, kiviConf: KiviConf, pluginPath: string) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    bot.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  KiviLogger.debug('enablePlugin: ' + pluginPath)

  const pluginName = getPluginNameByPath(pluginPath)

  try {
    KiviLogger.debug('plugin.pluginPath: ' + pluginPath)
    const plugin = (await require(pluginPath)) as KiviPlugin

    if (plugin?.mountKiviBotClient) {
      try {
        await plugin.mountKiviBotClient(bot, [...kiviConf.admins])

        plugins.set(pluginName, plugin)

        info(`插件 [${pluginName}] 启用成功`)

        return true
      } catch (e) {
        if (e instanceof KiviPluginError) {
          e.log()
        } else {
          error(`插件启用过程中发生错误: ${e}`)
        }
      }
    } else {
      error(colors.red(`插件 [${pluginName}] 没有默认导出 \`KiviPlugin\` 实例，请检查`))
    }
  } catch (e) {
    if (e instanceof KiviPluginError) {
      e.log()
    } else {
      error(`插件导入过程中发生错误: ${e}`)
    }
  }

  plugins.delete(pluginName)

  return false
}
