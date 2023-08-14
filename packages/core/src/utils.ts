import { createRequire } from 'node:module'

import type { Logger } from './logger.js'

export const require = createRequire(import.meta.url)

export function handleException(logger: Logger) {
  const handleException = (e: any) => {
    logger.error('发生了错误: ', e?.message || JSON.stringify(e) || e)
  }

  process.on('SIGINT', () => {
    logger.fatal('已退出 Kivi')
    process.exit(0)
  })

  process.on('uncaughtException', handleException)
  process.on('unhandledRejection', handleException)
}
