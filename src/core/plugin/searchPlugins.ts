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
  const localPlugins = [
    ...(await searchLocalPlugin()),
    '/home/viki/Workspace/kivibot/lib/examples/demoPlugin.js'
  ]

  const plugins = [...npmPlugins, ...localPlugins]

  const npm = npmPlugins.length
  const local = localPlugins.length
  const all = plugins.length

  const cnts = { npm, local, all }

  return {
    /** npm 数量 */
    npmPlugins,
    localPlugins,
    plugins,
    cnts
  }
}
