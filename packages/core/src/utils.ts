import createJiti from 'jiti'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import type { Logger } from './logger.js'

// @ts-expect-error fix type
export const loadModule = createJiti(fileURLToPath(import.meta.url), {
  extensions: ['.ts', '.mts', '.js', '.mjs'],
  cache: false,
  esmResolve: true,
  requireCache: false,
  v8cache: false,
  sourceMaps: false,
})

export const require = createRequire(import.meta.url)

export function handleException(logger: Logger) {
  function handleMessage(msg: string) {
    return msg.replace('签名api异常', '签名 API 返回异常，请重试')
  }

  const handleException = (e: any) => {
    logger.error('出错了: ', handleMessage(e?.message || JSON.stringify(e) || e))
  }

  process.on('SIGINT', () => {
    logger.fatal('已退出 Kivi')
    process.exit(0)
  })

  process.on('uncaughtException', handleException)
  process.on('unhandledRejection', handleException)
}
