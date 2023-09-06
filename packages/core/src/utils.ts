import { b, ensureArray, filesize } from '@kivi-dev/shared'
import createJiti from 'jiti'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import type { Logger } from './logger.js'
import type { Sendable } from 'icqq'

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
    return msg.replace('签名api异常', `签名 ${b('API')} 返回异常，请重试`)
  }

  const handleException = (e: any) => {
    logger.debug(e)
    logger.error('出错了: ', handleMessage(e?.message || JSON.stringify(e) || e))
  }

  process.on('SIGINT', () => {
    logger.fatal('已退出 Kivi')
    process.exit(0)
  })

  process.on('uncaughtException', handleException)
  process.on('unhandledRejection', handleException)
}

export function stringifySendable(content: Sendable) {
  const msgs = ensureArray(content)

  return msgs
    .map((message) => {
      if (typeof message === 'string' || message.type === 'text') {
        message = typeof message === 'string' ? message : message.text
        const msg = message.trim().slice(0, 160)
        return msg.length === message.length ? msg : `${msg}...(文本过长已截断)`
      }

      if (message.type === 'image') {
        if (message.file instanceof Buffer) {
          return `[图片: ${filesize(message.file.byteLength)} Buffer]`
        } else {
          const shortUrl = message.url?.replace(/\d+-\d+-(\w+)\/0/, '0-0-$1/0')
          return `[图片: ${shortUrl || '未知'}]`
        }
      }

      if (message.type === 'video') {
        const size = filesize(message.size || 0)
        return `[视频: ${size}, ${message.seconds || 0}s, ${message.fid || ''}]`
      }

      if (message.type === 'file') {
        const size = filesize(message.size || 0)
        return `[文件: ${size}, ${message.fid || ''}]`
      }

      if (message.type === 'at') {
        return `[at: ${message.qq || ''}]`
      }

      if (message.type === 'reply') {
        return `[回复: ${message.id || ''}]`
      }

      if (message.type === 'share') {
        return `[分享: ${message.url || ''}]`
      }

      if (message.type === 'xml') {
        return `[XML: ${message.data || ''}]`
      }

      if (message.type === 'json') {
        return `[JSON: ${message.data || ''}]`
      }

      if (message.type === 'face') {
        return `[表情: ${message.id || ''}]`
      }

      if (message.type === 'poke') {
        return `[戳: ${message.id || ''}]`
      }

      if (message.type === 'music') {
        return `[音乐: ${message.id || ''}]`
      }

      return JSON.stringify(message)
    })
    .join('')
}
