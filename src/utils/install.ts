import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { KiviLogger } from '@src'

// 安装 node 依赖
export async function install(pkg = '') {
  const promiseExec = promisify(exec)
  const cmd = `npm i ${pkg}`

  try {
    const { stderr } = await promiseExec(cmd)

    if (stderr) {
      if (/npm ERR/i.test(String(stderr))) {
        return false
      }
    }
    return true
  } catch (e: any) {
    KiviLogger.error(e?.message ?? e?.stack ?? JSON.stringify(e, null, 2))

    return false
  }
}
