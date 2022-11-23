import { KiviLogger } from '@/log'

/** 从 require 缓存中删除对应模块路径的插件缓存 */
export function killPlugin(modulePath: string) {
  const mod = require.cache[modulePath]

  if (!mod) {
    return
  }

  delete require.cache[modulePath]

  KiviLogger.debug('delete module cache: ' + modulePath)

  const idx = require.main?.children?.indexOf(mod)

  if (!idx || idx <= -1) {
    return
  }

  require.main?.children.splice(idx, 1)

  for (const fullpath in require.cache) {
    const modId = require.cache[fullpath]!.id
    const valid = modId.startsWith(mod.path)

    if (valid) {
      delete require.cache[fullpath]

      KiviLogger.debug('delete module cache: ' + fullpath)
    }
  }
}
