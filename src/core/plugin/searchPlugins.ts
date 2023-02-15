import fg from 'fast-glob'
import path from 'node:path'

import { NodeModuleDir, PluginDir } from '@/path'

/** 检索 `node_modules` 中可用的插件模块 */
export async function searchNpmPlugin() {
  return searchPlugins(NodeModuleDir, 'keli-*')
}

/** 检索 `plugins` 中可用的插件模块 */
export async function searchLocalPlugin() {
  return searchPlugins(PluginDir, '*')
}

/** 通过目录和 `glob` 匹配模式检索插件 */
const searchPlugins = async (cwd: string, pattern: string) => {
  const plugins = await fg(pattern, { cwd, onlyDirectories: true })
  return plugins.map((dir) => path.join(cwd, dir))
}

/** 搜索本地所有插件，包括 `npm` 安装的插件和 `plugins` 目录下的插件，以及对应插件的数量信息 */
export async function searchAllPlugins() {
  const npmPlugins = await searchNpmPlugin()
  const localPlugins = await searchLocalPlugin()

  const plugins = [...npmPlugins, ...localPlugins]

  const npm = npmPlugins.length
  const local = localPlugins.length
  const all = plugins.length

  return {
    /** npm 插件 */
    npmPlugins,
    /** 本地插件 */
    localPlugins,
    /** 所有插件 */
    plugins,
    /** 数目信息 */
    cnts: {
      /** `npm` 插件数量 */
      npm,
      /** 本地 `plugins` 目录下的插件数量 */
      local,
      /** 所有插件数量 */
      all
    }
  }
}
