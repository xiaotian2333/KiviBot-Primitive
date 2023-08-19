#!/usr/bin/env node

'use strict'

import { md5, showLogo } from '@kivi-dev/shared'
import kleur from 'kleur'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import prompts from 'prompts'

import { appJSCode, pkgJSON } from './constants.js'
import { getProjectDir } from './get-project-dir.js'

import type { BotConfig } from '@kivi-dev/types'

showLogo(createRequire(import.meta.url)('../package.json').version)

const dir = await getProjectDir()

const { uin = '' } = await prompts({
  type: 'text',
  name: 'uin',
  message: '请输入 Bot 的 QQ 号',
  validate: (admins) => (!admins.length ? 'Bot QQ 号不能为空' : true),
  format: (value) => Number(value),
})

const { platform } = await prompts({
  type: 'select',
  name: 'platform',
  message: '请选择登录协议',
  initial: 0,
  choices: [
    // oicq 登录协议：1 为安卓手机, 2 为安卓平板, 3 为安卓手表, 4 为 MacOS, 5 为 iPad
    { title: '平板 Pad', value: 2 },
    { title: '手机 Phone', value: 1 },
    { title: '电脑 PC', value: 4 },
    { title: '手表 Watch', value: 3 },
    { title: '备选协议（6）', value: 6 },
  ],
})

const { admins = [] } = await prompts({
  type: 'list',
  name: 'admins',
  message: '请输入管理员 QQ 号',
  format: (list: string[]) => [...new Set(list.filter(Boolean))].map(Number),
  validate: (admins) => (!admins.length ? '管理员不能为空' : true),
})

const [mainAdmin, ...subAdmins] = admins as [number, ...number[]]

const { loginMode } = await prompts({
  name: 'loginMode',
  type: 'select',
  message: '请选择登录方式',
  initial: 0,
  choices: [
    { title: '🔑 密码登录', value: 'password' },
    { title: '📱 扫码登录', value: 'qrcode' },
  ],
})

const config: BotConfig = {
  uin,
  platform,
  prefix: '.',
  admins: [mainAdmin, ...subAdmins],
  loginMode,
  plugins: [],
  oicq_config: {
    sign_api_addr: '',
  },
}

if (loginMode === 'password') {
  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: '请输入 Bot 的 QQ 密码',
    validate: (password) => (!password.length ? '登录密码不能为空' : true),
  })

  const { deviceMode } = await prompts({
    name: 'deviceMode',
    type: 'select',
    initial: 0,
    message: '请选择设备锁验证方式',
    choices: [
      { title: '💬 短信验证码', value: 'sms' },
      { title: '📱 扫描二维码', value: 'qrcode' },
    ],
  })

  config.deviceMode = deviceMode
  config.password = md5(password, 'hex') as string
}

fs.writeFileSync(path.join(dir, 'app.js'), appJSCode)
fs.writeFileSync(path.join(dir, 'package.json'), pkgJSON)
fs.writeFileSync(path.join(dir, 'kivi.json'), JSON.stringify(config, null, 2))

const isCurrentDir = dir === process.cwd()
const extraCmd = isCurrentDir ? '' : `cd ${path.basename(dir)}\n\n`

console.log(
  [
    kleur.green(`\n✨ Kivi 初始化完成\n`),
    kleur.dim(`你可以通过以下命令启动 Kivi 👇\n\n${extraCmd}npm i\nnpm start\n`),
  ].join('\n'),
)
