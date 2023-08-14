import path from 'node:path'
import { fileURLToPath } from 'node:url'

import KiviClient from './kivi-client.js'

export const start = async (dir?: string) => {
  return await new KiviClient().start(dir)
}

export function dirname(meta: ImportMeta) {
  return path.dirname(fileURLToPath(meta.url))
}