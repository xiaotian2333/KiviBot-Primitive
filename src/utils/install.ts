import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { KiviLogger } from '@src'

// 安装 node 依赖
export async function install(pkg = '') {
  const promiseExec = promisify(exec)
  const cmd = `npm i ${pkg} --registry=https://registry.npmmirror.com`

  try {
    const { stderr } = await promiseExec(cmd)

    if (stderr) {
      if (/npm ERR/i.test(String(stderr))) {
        return false
      }
    }
    return true
  } catch (e) {
    KiviLogger.error(JSON.stringify(e, null, 2))
    return false
  }
}
