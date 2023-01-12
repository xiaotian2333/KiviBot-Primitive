import path from 'node:path'
import ncu from 'npm-check-updates'

import { install } from './install'
import { CWD } from '@/src/core'

/** 更新依赖 */
export async function update(pkg?: string) {
  const upInfo = await ncu({
    packageFile: path.join(CWD, 'package.json'),
    filter: pkg ?? ['@kivibot/*', 'kivibot', 'kivibot-*'],
    upgrade: true,
    jsonUpgraded: true
  })

  const res = await install()
  return res ? upInfo : false
}
