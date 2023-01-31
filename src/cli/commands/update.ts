import axios from 'axios'
import path from 'node:path'
import ncu from 'npm-check-updates'
import ora from 'ora'

import { CWD } from '@/path'
import { colors, notice, promiseExec, v } from '@/utils'

const loading = ora()

async function getLatestVersion(module: string) {
  const api = `https://registry.npmjs.org/${module}`
  const accept = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'

  const { data } = await axios.get(api, { headers: { accept } })
  const vs = Object.keys(data?.versions)

  return vs.length ? vs[vs.length - 1] : ''
}

export async function update() {
  loading.start(`正在检查 miobot 更新...`)
  const lv = await getLatestVersion('miobot')

  if (lv !== v) {
    loading.stop()

    const updateCmd = 'npm up miobot'

    notice.warn(colors.gray(`miobot ${lv} 已发布，你可以通过以下命令进行更新:`))
    console.log(colors.cyan(updateCmd))
  } else {
    loading.succeed('miobot 已是最新')
  }

  loading.start(`正在检查插件更新...`)

  try {
    const upInfo = await ncu({
      packageFile: path.join(CWD, 'package.json'),
      filter: ['miobot-*'],
      upgrade: true,
      jsonUpgraded: true
    })

    const npmUpCmd = `npm up`

    const { stderr } = await promiseExec(npmUpCmd)

    if (stderr) {
      if (/npm ERR/i.test(String(stderr))) {
        loading.fail(`发生错误：`)
        console.log(stderr)
        loading.fail(`更新失败，参考上面的错误日志`)

        return false
      }
    }

    if (upInfo) {
      const info = Object.entries(upInfo)
        .map((k, v) => `${k} => ${v}`)
        .join('\n')

      loading.succeed(info || '已是最新')
    }
  } catch (e) {
    loading.fail(`发生错误：`)
    console.log(e)
    loading.fail(`更新失败，参考上面的错误日志`)
  }
}

update.help = `
      update\t更新 miobot 框架和插件依赖`
