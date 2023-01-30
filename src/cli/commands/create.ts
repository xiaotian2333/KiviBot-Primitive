import fs from 'fs-extra'
import path from 'node:path'
import prompts from 'prompts'

import { installDependencies } from './install'
import { js_template } from '../templates/javascript'
import { pkg_js_template, pkg_ts_template } from '../templates/package-json'
import { ts_config, ts_template } from '../templates/typescript'
import { PluginDir } from '@/path'
import { checkModule, notice } from '@/utils'

import type { ParsedArgs } from 'minimist'

export const create = async (args: ParsedArgs) => {
  const pluginName = args._[0]

  // 当前 node_modules 目录下是否已存在 TS 依赖
  const isTypeScriptExist = checkModule('typescript')

  const { lang, inputPluginName, needInstallTypescript } = await prompts([
    {
      type: pluginName ? null : 'text',
      name: 'inputPluginName',
      message: '插件名',
      initial: 'demo'
    },
    {
      type: 'select',
      name: 'lang',
      message: '开发语言',
      choices: [
        { title: 'JavaScript', value: 'JS' },
        { title: 'TypeScript', value: 'TS' }
      ],
      initial: 0
    },
    {
      type: (pre) => (pre === 'TS' && !isTypeScriptExist ? 'confirm' : null),
      name: 'needInstallTypescript',
      message: '未检测到 TS 依赖，是否要为你安装?',
      initial: true
    }
  ])

  const pname = pluginName ?? inputPluginName
  const pluginDirPath = path.join(PluginDir, pname)

  if (fs.existsSync(pluginDirPath)) {
    const { cover } = await prompts([
      {
        type: 'confirm',
        name: 'cover',
        message: `插件 ${pname} 已存在，是否覆盖？`,
        initial: false
      }
    ])

    if (cover) {
      fs.removeSync(pluginDirPath)

      notice.info(`已删除: ${pluginDirPath}`)
    } else {
      notice.success('已取消')
      process.exit(0)
    }
  }

  // 确保插件目录存在
  fs.ensureDirSync(pluginDirPath)

  if (lang === 'TS') {
    try {
      // 写入 pakcage.json
      fs.writeFileSync(path.join(pluginDirPath, 'package.json'), pkg_ts_template)
      fs.writeFileSync(path.join(pluginDirPath, 'index.ts'), ts_template)
      fs.writeFileSync(path.join(pluginDirPath, 'tsconfig.json'), ts_config)
    } catch {
      notice.error('文件写入失败')
      process.exit(1)
    }

    if (needInstallTypescript) {
      await installDependencies('typescript')
    }
  } else if (lang === 'JS') {
    try {
      // 写入 pakcage.json
      fs.writeFileSync(path.join(pluginDirPath, 'package.json'), pkg_js_template)
      fs.writeFileSync(path.join(pluginDirPath, 'index.js'), js_template)
    } catch {
      notice.error('文件写入失败')
      process.exit(1)
    }
  }

  notice.success(`已创建: ${pluginDirPath}`)
}

create.help = `
      create\t初始化插件开发模板 (JS/TS)，可选传入插件名`
