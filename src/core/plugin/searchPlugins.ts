import fg from 'fast-glob'
import path from 'node:path'

import { NodeModulesDir, PluginDir } from '..'

/** 检索 node_modules 中可用的插件模块 */
export async function searchNpmPlugin() {
  return searchPlugins(NodeModulesDir, 'kivibot-plugin-*')
}

/** 检索 plugins 中可用的插件模块 */
export async function searchLocalPlugin() {
  return searchPlugins(PluginDir, '*')
}

/** 通过目录和 glob 匹配模式检索插件 */
const searchPlugins = async (cwd: string, pattern: string) => {
  const plugins = await fg(pattern, { cwd, onlyDirectories: true })
  return plugins.map((dir) => path.join(cwd, dir))
}

export async function searchAllPlugins() {
  const npmPlugins = await searchNpmPlugin()
  const localPlugins = await searchLocalPlugin()

  const plugins = [...npmPlugins, ...localPlugins]

  const npm = npmPlugins.length
  const local = localPlugins.length
  const all = plugins.length

  const cnts = { npm, local, all }

  return {
    /** npm 插件数量 */
    npmPlugins,
    /** 本地插件数量 */
    localPlugins,
    /** 所有插件 */
    plugins,
    /** 所有数目 */
    cnts
  }
}
