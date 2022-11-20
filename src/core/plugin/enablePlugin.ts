import colors from '@src/utils/colors'
import { KiviLogger } from '@/log'

import type { Client } from 'oicq'
import type { KiviConf } from '@/start'
import type { KiviPlugin } from './plugin'

export default async function enablePlugin(bot: Client, conf: KiviConf, pluginPath: string) {
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
        const name = await plugin.mountKiviBotClient(bot, conf.admins)
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

export function getPluginNameByPath(path: string) {
  const paths = path.split('/')
  return paths[paths.length - 1].replace('kivibot-plugin-', '')
}
