import { enablePlugin } from './enablePlugin'
import { searchAllPlugins } from './searchPlugins'
import { getPluginNameByPath } from './utils'

import type { MioConf } from '@/core'
import type { Client } from 'movo'

/** 检索并加载 node_modules 和 plugins 目录下的插件 */
export async function loadPlugins(bot: Client, mioConf: MioConf) {
  // 检索本地所有插件（node_modules 里 `miobot-` 开头的插件 和 plugins 下的插件）
  const { plugins, cnts } = await searchAllPlugins()
  const { all, npm, local } = cnts

  let cnt = 0
  const enablePlugins = []

  for (const pluginPath of plugins) {
    const pluginName = getPluginNameByPath(pluginPath)

    // 跳过未设置启用的插件
    if (!mioConf.plugins.includes(pluginName)) {
      continue
    }

    const isOK = await enablePlugin(bot, mioConf, pluginPath)

    // 启用成功时，启用插件数加一
    if (isOK) {
      cnt++
      enablePlugins.push(pluginName)
    }
  }

  return { plugins: enablePlugins, all, npm, local, cnt }
}
