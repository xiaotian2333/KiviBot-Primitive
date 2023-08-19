import os from 'node:os'

import { searchAllPlugins } from './searchPlugins.js'

const isWin = os.platform() === 'win32'

/** 通过模块路径获取插件名称，如果是 `npm` 插件，则自动去掉 `keli-` 前缀 */
export function getPluginNameByPath(path: string) {
  const paths = path.split(isWin ? '\\' : '/')
  return paths[paths.length - 1].replace(/^keli-/i, '')
}

/** 通过插件名定位插件路径的函数 */
export async function getPluginPathByName(pluginName: string) {
  const { plugins } = await searchAllPlugins()
  return plugins.find((p) => getPluginNameByPath(p) === pluginName)
}
