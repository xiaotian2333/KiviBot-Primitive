import { kleur, prompts } from '@kivi-dev/shared'
import fs from 'node:fs'
import path from 'node:path'

const dirArg = process.argv[2] || ''
const cwd = process.cwd()

export async function getProjectDir() {
  if (dirArg) {
    fs.mkdirSync(path.join(cwd, dirArg))

    return path.join(cwd, dirArg)
  }

  if (fs.readdirSync(cwd).length) {
    const { dirName } = await prompts({
      type: 'text',
      name: 'dirName',
      message: '请输入项目名称（文件夹名）',
      initial: 'kivi-bot',
      validate: (name) => (!name ? '项目名称不能为空' : true),
    })

    if (!dirName) {
      console.log(kleur.green('✔ ') + '已终止操作')
      process.exit(0)
    }

    const targetDir = path.join(cwd, dirName)

    if (fs.existsSync(targetDir)) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `目录 \`${dirName}\` 已存在，是否覆盖？`,
        initial: false,
      })

      if (!confirm) {
        console.log(kleur.green('✔ ') + '已终止操作')
        process.exit(0)
      } else {
        fs.rmSync(targetDir, { recursive: true })
      }
    }

    fs.mkdirSync(targetDir)

    return targetDir
  } else {
    return cwd
  }
}
