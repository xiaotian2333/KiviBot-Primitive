import os from 'node:os'

const isWin = os.platform() === 'win32'

/** 通过模块路径获取插件名称，如果是 `npm` 插件，则自动去掉 `miobot-plugin-` 前缀 */
export function getPluginNameByPath(path: string) {
  const paths = path.split(isWin ? '\\' : '/')
  return paths[paths.length - 1].replace(/^miobot-plugin-/i, '')
}
