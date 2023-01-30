import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import ora from 'ora'

import { colors, ensureArray, notice } from '@/utils'

import type { ParsedArgs } from 'minimist'

const loading = ora()

export const mioDeps = ['@miobot/core']

export async function installDependencies(_deps: string | string[] = []) {
  const promiseExec = promisify(exec)
  const modules = ensureArray(_deps)

  const mds = colors.cyan(modules.map((mod) => mod).join(', '))
  const mdsStr = mds ? ` ${mds} ` : ''

  loading.start(`正在安装${mdsStr}`)

  const cmd = `npm i ${modules.join(' ')}`

  try {
    const { stderr } = await promiseExec(cmd)

    if (stderr) {
      if (/npm ERR/i.test(String(stderr))) {
        loading.stop()
        notice.warn(`${mdsStr}安装失败，npm 输出如下: `)
        console.log(stderr)
        notice.error(`${mdsStr}安装失败`)
        return false
      }
    }
  } catch (e) {
    notice.error(`${mdsStr}安装失败`)
    return false
  }

  loading.succeed(`${mdsStr}安装成功`)
  return true
}

export async function install(args: ParsedArgs) {
  const modules = args._.length ? args._ : mioDeps
  await installDependencies(modules)
}

install.help = `
      install\t安装 node 依赖`
