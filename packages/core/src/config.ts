import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { CONFIG_FILE_NAME } from './constants.js'

import type { BotConfig } from '@kivi-dev/types'

export function resolveConfig(root: string) {
  const configPath = path.join(root, CONFIG_FILE_NAME)

  if (!existsSync(configPath)) {
    throw new Error('kivi.json 不存在，请先使用 npm create kivi 创建。')
  }

  const require = createRequire(import.meta.url)
  const botConfigs = (require(configPath) as BotConfig[]) || []

  return botConfigs.map((c) => defu(c, {}))
}
