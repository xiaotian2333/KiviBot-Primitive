import fs from 'fs-extra'
import prompts from 'prompts'

import { start } from './start'
import { bot_pkg } from '../constants'
import { getQuestions } from '../questions'

import type { ParsedArgs } from 'minimist'

import { AppPath, ConfigPath, PkgPath } from '@/path'
import { notice, colors, md5 } from '@/utils'

export const DefaultNoticeConfig = {
  enable: true,
  friend: {
    request: {
      enable: true,
      action: 'ignore'
    },
    increase: true,
    decrease: true,
    message: false
  },
  group: {
    request: {
      enable: true,
      action: 'ignore'
    },
    increase: true,
    decrease: true,
    ban: true,
    admin: true,
    transfer: true
  }
}

export async function init(args: ParsedArgs) {
  const isDev = args.development || args.dev || args.d
  const isProd = args.production || args.prod || args.p
  const needStart = args.start || args.s

  const config: any = {}

  const isSwitch = fs.existsSync(ConfigPath)

  if (isSwitch) {
    Object.assign(config, fs.readJsonSync(ConfigPath))
    Object.assign(bot_pkg, fs.readJsonSync(PkgPath))
  }

  const answer = await prompts(getQuestions(isSwitch ? 'switch' : 'init'))

  answer.password ??= ''
  answer.device_mode ??= 'sms'

  if (!answer.login_mode || (answer.login_mode === 'password' && !answer.password)) {
    process.exit(0)
  }

  const level = isDev ? 'debug' : 'info'
  const msg_mode = isDev ? 'detail' : config?.message_mode ?? 'short'

  const isOK = writeKeliConf({
    account: answer.account,
    login_mode: answer.login_mode,
    device_mode: answer.device_mode,
    message_mode: isProd ? 'short' : msg_mode,
    password: answer.password ? md5(answer.password, 'hex') : '',
    log_level: config?.log_level ?? level,
    admins: config?.admins ?? answer.admins,
    plugins: config?.plugins ?? [],
    notice: config?.notice ?? DefaultNoticeConfig,
    oicq_config: {
      log_level: isProd ? 'off' : level,
      ...(config?.oicq_config ?? {}),
      platform: answer.platform
    }
  })

  fs.writeFileSync(AppPath, "require('keli').start()\n")
  fs.writeFileSync(PkgPath, JSON.stringify(bot_pkg, null, 2))

  const files = ['keli.json', 'app.js', 'package.json'].map(colors.cyan)

  if (isOK) {
    notice.success(`created: ${files.join(', ')}`)

    if (needStart) {
      await start()
    }
  } else {
    notice.error('failed to write file')
    process.exit(1)
  }
}

function writeKeliConf(conf: Record<string, any>) {
  try {
    fs.writeJsonSync(ConfigPath, conf, { spaces: 2 })
    return true
  } catch {
    return false
  }
}
