import colors from '@src/utils/colors'
import { KiviLogger } from '@/log'

import type { Client } from 'oicq'
import type { KiviConf } from '@/start'
import type { KiviPlugin } from './plugin'

/** 通过插件模块路径启用单个插件 */
export default async function enablePlugin(bot: Client, kiviConf: KiviConf, pluginPath: string) {
  const error = (msg: any, ...args: any[]) => {
    bot.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const info = (msg: any, ...args: any[]) => {
    bot.logger.info(msg, ...args)
    KiviLogger.info(msg, ...args)
  }

  const pluginName = getPluginNameByPath(pluginPath)

  try {
    const plugin: KiviPlugin = (await import(pluginPath)).default

    if (plugin.mountKiviBotClient) {
      try {
        const name = await plugin.mountKiviBotClient(bot, kiviConf.admins)
        info(`插件「${name}（${pluginName}）」加载成功`)
        return true
      } catch (e) {
        error(`插件启用过程中发生错误: ${e}`)
      }
    } else {
      error(colors.red(`插件「${pluginName}」没有默认导出 \`KiviPlugin\` 实例，请检查`))
    }
  } catch (e) {
    error(`插件「${pluginName}」导入过程中发生错误: ${e}`)
  }
  return false
}

/** 通过模块路径获取插件名称，如果是 `npm` 插件，则自动去掉 `kivibot-plugin-` 前缀 */
export function getPluginNameByPath(path: string) {
  const paths = path.split('/')
  return paths[paths.length - 1].replace('kivibot-plugin-', '')
}
