import { searchAllPlugins } from './searchPlugins'
import enablePlugin, { getPluginNameByPath } from './enablePlugin'

import type { Client } from 'oicq'
import type { KiviConf } from '@/start'

/** 检索并加载 node_modules 和 plugins 目录下的插件 */
export default async function loadPlugins(bot: Client, kiviConf: KiviConf) {
  // 检索本地所有插件（node_modukles 里 `kivibot-plugin-` 开头的插件 和 plugins 下的插件）
  const { plugins, cnts } = await searchAllPlugins()
  const { all, npm, local } = cnts

  let cnt = 0

  for (const pluginPath of plugins) {
    const pluginName = getPluginNameByPath(pluginPath)

    // 跳过未设置启用的插件
    if (!kiviConf.plugins.includes(pluginName)) {
      continue
    }

    const isOK = await enablePlugin(bot, kiviConf, pluginPath)

    // 启用成功时，启用插件数加一
    if (isOK) cnt++
  }

  return { all, npm, local, cnt }
}
