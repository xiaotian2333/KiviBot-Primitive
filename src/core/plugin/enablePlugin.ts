import { colors, escapeColor, stringifyError } from '@src/utils'
import { getPluginNameByPath } from './getPluginNameByPath'
import { KiviLogger } from '@/logger'
import { KiviPluginError } from './pluginError'
import { plugins } from '@/start'
import fs from 'node:fs'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'
import type { KiviPlugin } from './plugin'

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
    // ISSUE require加载先前已经加载过的模块不会更新，所以导致reload的插件信息未更新
    const { plugin } = (await require(pluginPath)) as { plugin: KiviPlugin | undefined }

    if (plugin && plugin?.mountKiviBotClient) {
      try {
        await plugin.mountKiviBotClient(bot, [...kiviConf.admins])

        // TODO plugins 缓存优化
        // 通过 package.json 中的版本号更新 plugin.version
        const packageJson = JSON.parse(
            fs.readFileSync(pluginPath + '\\package.json').toString()
        )
        plugin.version = packageJson.version

        KiviLogger.debug('plugin: ' + JSON.stringify(plugin))

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
      return msg
    }
  }
}
