import { b } from '@kivi-dev/shared'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { CONFIG_FILE_NAME } from './constants.js'
import { require } from './utils.js'

import type { BotConfig } from '@kivi-dev/types'

export function resolveConfig(root: string) {
  const configPath = path.join(root, CONFIG_FILE_NAME)

  if (!existsSync(configPath)) {
    throw new Error(`${b('kivi.json')} 不存在，请先使用 ${b('npm create kivi')} 创建。`)
  }

  return require(configPath) as BotConfig
}
