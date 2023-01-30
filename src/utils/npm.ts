import path from 'node:path'
import ncu from 'npm-check-updates'

import { promiseExec } from './utils'
import { MioLogger } from '@/core'
import { CWD } from '@/path'

/** 更新依赖 node 依赖 */
export async function update(pkg?: string) {
  const upInfo = await ncu({
    packageFile: path.join(CWD, 'package.json'),
    filter: pkg ?? ['miobot', 'miobot-*'],
    upgrade: true,
    jsonUpgraded: true
  })

  const res = await install()
  return res ? upInfo : false
}

// 安装或卸载 node 依赖
export async function install(pkg?: string, isUninstall = false) {
  const cmd = `npm ${isUninstall ? 'uninstall' : 'install'} ${pkg ?? ''} --force`

  const { stderr } = await promiseExec(cmd)

  if (stderr) {
    if (/npm ERR/i.test(stderr)) {
      MioLogger.error(stderr)

      return false
    }
  }

  return true
}
