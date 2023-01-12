import path from 'node:path'

/** 从 require 缓存中删除对应模块路径的插件缓存 */
export function killPlugin(modulePath: string) {
  // 确保路径和 cache 中的 key 一致
  const mainPath = require.resolve(modulePath)

  const mod = require.cache[mainPath] as NodeJS.Module

  if (!mod) {
    return
  }

  const idx = require.main?.children.indexOf(mod) as number

  if (idx >= 0) {
    require.main?.children.splice(idx, 1)
  }

  for (const fullPath in require.cache) {
    const modId = require.cache[fullPath]?.id
    const valid = modId?.startsWith(mod.path)

    if (valid) {
      delete require.cache[fullPath]
    }
  }

  delete require.cache[mainPath]
  delete require.cache[path.join(modulePath, 'package.json')]
}
