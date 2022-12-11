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
    KiviLogger.debug('pluginPath: ' + pluginPath)
    const { plugin } = (await require(pluginPath)) as { plugin: KiviPlugin | undefined }

    if (plugin && plugin?.mountKiviBotClient) {
      try {
        await plugin.mountKiviBotClient(bot, [...kiviConf.admins])

        plugins.set(pluginName, plugin)

        info(`plugin ${colors.green(pluginName)} is now on`)

        return true
      } catch (e) {
        KiviLogger.error(JSON.stringify(e, null, 2))

        if (e instanceof KiviPluginError) {
          e.log()
        } else {
          error(`error occurred during mount: \n${JSON.stringify(e, null, 2)}`)
        }
      }
    } else {
      error(
        colors.red(
          `plugin ${colors.green(pluginName)} dosen't export \`KiviPlugin\` instance as \`plugin\``
        )
      )
    }
  } catch (e) {
    KiviLogger.error(JSON.stringify(e, null, 2))

    if (e instanceof KiviPluginError) {
      e.log()
    } else {
      error(`error occurred during require: \n${JSON.stringify(e, null, 2)}`)
    }
  }

  plugins.delete(pluginName)

  return false
}
