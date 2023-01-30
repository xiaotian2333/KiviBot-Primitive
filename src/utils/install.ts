import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { KiviLogger } from '@/src/core'

const promiseExec = promisify(exec)

// 安装或卸载 node 依赖
export async function install(pkg?: string, isUninstall = false) {
  const cmd = `npm ${isUninstall ? 'uninstall' : 'install'} ${pkg ?? ''}`

  const { stderr } = await promiseExec(cmd)

  if (stderr) {
    if (/npm ERR/i.test(stderr)) {
      KiviLogger.error(stderr)

      return false
    }
  }

  return true
}
