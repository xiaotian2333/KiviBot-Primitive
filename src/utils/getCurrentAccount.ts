import { ConfigPath } from '@/path'

export function getCurrentAccount() {
  const mioConf = require(ConfigPath)
  return String(mioConf?.account ?? '')
}
