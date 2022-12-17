import ncu from 'npm-check-updates'
import path from 'node:path'

import { install } from './install'
import { CWD, KiviLogger } from '@src/core'

/** 更新依赖 */
export async function update(pkg = '') {
  const upInfo = await ncu({
    packageFile: path.join(CWD, 'package.json'),
    filter: pkg || ['@kivibot/*', 'kivibot', 'kivibot-*'],
    upgrade: true,
    jsonUpgraded: true
  })

  try {
    const res = await install()

    if (res) {
      return upInfo
    } else {
      return false
    }
  } catch (e: any) {
    KiviLogger.error(e?.message ?? e?.stack ?? JSON.stringify(e, null, 2))

    return false
  }
}
