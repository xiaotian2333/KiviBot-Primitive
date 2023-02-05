import fs from 'fs-extra'
import prompts from 'prompts'

import { start } from './start'
import { bot_pkg } from '../utils'
import { AppPath, ConfigPath, PkgPath } from '@/path'
import { base64encode, notice, colors } from '@/utils'

import type { ParsedArgs } from 'minimist'
import type { PromptObject } from 'prompts'

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

export function getQuestions(mode: 'init' | 'switch' = 'init') {
  const isSwitch = mode === 'switch'

  return [
    {
      name: 'account',
      type: 'text',
      message: 'bot uin',
      validate: (input) => {
        return /^[1-9]\d{4,9}$/.test(input.trim()) ? true : 'invalid uin'
      },
      format: (e) => Number(e.trim())
    },
    {
      name: 'platform',
      type: 'select',
      message: 'platform',
      initial: 0,
      choices: [
        {
          title: 'iPad',
          value: 5
        },
        {
          title: 'aPhone',
          value: 1
        },
        {
          title: 'APad',
          value: 2
        },
        {
          title: 'MacOS',
          value: 4
        },
        {
          title: 'aWatch',
          value: 3
        }
      ]
    },
    {
      name: 'admins',
      type: isSwitch ? null : 'list',
      message: 'bot admins',
      separator: ' ',
      format: (list: string[]) => [...new Set(list.filter((e) => !!e).map(Number))],
      validate: (list: string) => {
        return /^[1-9]\d{4,9}(\s+[1-9]\d{4,9})*$/.test(list.trim()) ? true : 'invalid admin uin'
      }
    },
    {
      name: 'login_mode',
      type: 'select',
      message: 'login mode',
      initial: 0,
      choices: [
        {
          title: 'password',
          value: 'password'
        },
        {
          title: 'qrcode',
          value: 'qrcode'
        }
      ]
    },
    {
      name: 'password',
      type: (login_mode) => {
        return login_mode === 'password' ? 'text' : null
      },
      message: 'bot password',
      style: 'password',
      validate: (password) => {
        return /^.{6,16}$/.test(password.trim()) ? true : 'invalid password'
      },
      format: (password) => password.trim()
    },
    {
      name: 'device_mode',
      type: (prev) => {
        return prev === 'qrcode' ? null : 'select'
      },
      initial: 0,
      message: 'device mode',
      choices: [
        {
          title: 'sms',
          value: 'sms'
        },
        {
          title: 'qrcode',
          value: 'qrcode'
        }
      ]
    }
  ] as PromptObject[]
}

export async function init(args: ParsedArgs) {
  const isDev = args.dev || args.d
  const isProd = args.prod || args.p
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
    password: base64encode(answer.password),
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

  fs.writeFileSync(AppPath, "require('keli').start()")
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
