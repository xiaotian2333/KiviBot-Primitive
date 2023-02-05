import { ensureDirSync, writeFileSync, removeSync, existsSync } from 'fs-extra'
import path from 'node:path'
import prompts from 'prompts'

import { js_template, p_pkg_js, p_pkg_ts, ts_config, ts_template } from '../utils'
import { PluginDir } from '@/path'
import { install, moduleExists, notice } from '@/utils'

import type { ParsedArgs } from 'minimist'

export const create = async (args: ParsedArgs) => {
  const pluginName = args._[0]

  // 是否已安装 TypeScript 依赖
  const isTsInstalled = moduleExists('typescript')

  const { lang, inputPluginName, needTS } = await prompts([
    {
      type: pluginName ? null : 'text',
      name: 'inputPluginName',
      message: 'plugin name',
      initial: 'demo'
    },
    {
      type: 'select',
      name: 'lang',
      message: 'develop language',
      choices: [
        { title: 'JavaScript', value: 'JS' },
        { title: 'TypeScript', value: 'TS' }
      ],
      initial: 0
    },
    {
      type: (pre) => (pre === 'TS' && !isTsInstalled ? 'confirm' : null),
      name: 'needTS',
      message: 'no TS dependency detected, install it now?',
      initial: true
    }
  ])

  const pname = pluginName ?? inputPluginName
  const pluginDirPath = path.join(PluginDir, pname)

  if (existsSync(pluginDirPath)) {
    const { cover } = await prompts([
      {
        type: 'confirm',
        name: 'cover',
        message: `plugin ${pname} already exist, cover it?`,
        initial: false
      }
    ])

    if (cover) {
      removeSync(pluginDirPath)

      notice.success(`deleted: ${pluginDirPath}`)
    } else {
      notice.success('cancelled')
      process.exit(0)
    }
  }

  // 确保插件目录存在
  ensureDirSync(pluginDirPath)

  if (lang === 'TS') {
    try {
      p_pkg_ts.name = pluginName
      // 写入 package.json
      writeFileSync(path.join(pluginDirPath, 'package.json'), JSON.stringify(p_pkg_ts, null, 2))
      writeFileSync(path.join(pluginDirPath, 'index.ts'), ts_template.replace('xxx', pluginName))
      writeFileSync(path.join(pluginDirPath, 'tsconfig.json'), JSON.stringify(ts_config, null, 2))
    } catch {
      notice.error('failed to write file')
      process.exit(1)
    }

    if (needTS) {
      await install('typescript')
    }
  } else if (lang === 'JS') {
    try {
      p_pkg_js.name = pluginName
      // 写入 package.json
      writeFileSync(path.join(pluginDirPath, 'package.json'), JSON.stringify(p_pkg_js, null, 2))
      writeFileSync(path.join(pluginDirPath, 'index.js'), js_template.replace('xxx', pluginName))
    } catch {
      notice.error('failed to write file')
      process.exit(1)
    }
  }

  notice.success(`created: ${pluginDirPath}`)
}
