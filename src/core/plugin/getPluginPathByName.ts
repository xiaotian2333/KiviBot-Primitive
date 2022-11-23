import { getPluginNameByPath } from './getPluginNameByPath'
import { searchAllPlugins } from './searchPlugins'

/** 通过插件名定位插件路径的函数 */
export async function getPluginPathByName(pluginName: string) {
  const { plugins } = await searchAllPlugins()

  const path = plugins.find((p) => getPluginNameByPath(p) === pluginName)

  return path
}
