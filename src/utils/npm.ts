import path from 'node:path'
import ncu from 'npm-check-updates'

import { promiseExec } from './utils'
import { CWD } from '@/path'

/** 更新依赖 node 依赖 */
export async function update(pkg?: string) {
  const jsonInfo = (await ncu({
    upgrade: true,
    cacheClear: true,
    packageFile: path.join(CWD, 'package.json'),
    filter: pkg ?? ['keli', 'keli-*']
  })) as Record<string, string>

  const { isOK, info } = await install()

  const upInfo =
    Object.entries(jsonInfo)
      .map(([k, v]) => `${k.replace('keli-', 'plugin: ')} => ${v.replace('^', '')}`)
      .join('\n') || ''

  return {
    isOK,
    info: isOK ? upInfo : info
  }
}

/** 安装或卸载 node 依赖 */
export async function install(pkg?: string, uninstall = false) {
  const cmd = `npm ${uninstall ? 'uninstall' : 'install'} ${pkg ?? ''} --force`

  const { stderr } = await promiseExec(cmd)

  if (stderr) {
    if (/npm ERR/i.test(stderr)) {
      return { isOK: false, info: stderr }
    }
  }

  return { isOK: true, info: '' }
}
