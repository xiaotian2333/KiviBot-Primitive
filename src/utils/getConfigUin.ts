import { nanoid } from 'nanoid'

import { ConfigPath } from '@/path'

export function getConfigUin() {
  const mioConf = require(ConfigPath)
  return String(mioConf?.account ?? 'mio_' + nanoid(4))
}
