#!/usr/bin/env node

'use strict'

import { md5 } from '@kivi-dev/shared'
import kleur from 'kleur'
import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'

import { appJSCode, pkgJSON } from './constants.js'
import { getProjectDir } from './get-project-dir.js'

import type { BotConfig } from '@kivi-dev/types'

console.log(`\n${kleur.bgGreen().dim(` KiviBot v1.0 `)}\n`)

const dir = await getProjectDir()

const { uin = '' } = await prompts({
  type: 'text',
  name: 'uin',
  message: '请输入 Bot 的 QQ 号',
  validate: (admins) => (!admins.length ? 'Bot QQ 号不能为空' : true),
})

const { platform } = await prompts({
  type: 'select',
  name: 'platform',
  message: '请选择 Bot 登录协议',
  initial: 0,
  choices: [
    { title: '平板 Pad', value: 1 },
    { title: '手机 Phone', value: 2 },
    { title: '电脑 PC', value: 3 },
    { title: '手表 Watch', value: 4 },
  ],
})

const { admins = [] } = await prompts({
  type: 'list',
  name: 'admins',
  message: '请输入 Bot 管理员',
  format: (list: string[]) => [...new Set(list.filter(Boolean))],
  validate: (admins) => (!admins.length ? '管理员不能为空' : true),
})

const [mainAdmin, ...subAdmins] = admins

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
  admins: [mainAdmin, ...subAdmins],
  loginMode,
}

if (loginMode === 'password') {
  const { password } = await prompts({
    type: 'text',
    name: 'password',
    message: '请输入 Bot 的 QQ 账号密码',
    validate: (password) => (!password.length ? '登录密码不能为空' : true),
  })

  const { deviceMode } = await prompts({
    name: 'deviceMode',
    type: 'select',
    initial: 0,
    message: 'device mode',
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

console.log(
  [
    kleur.green(`\nKivi 初始化完成 ✨ \n`),
    kleur.dim('你可以通过以下命令启动 Kivi 👇\n\nnpm i\nnpm run start\n'),
  ].join('\n')
)
