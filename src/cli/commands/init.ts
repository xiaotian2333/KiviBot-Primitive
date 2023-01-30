import fs, { writeFileSync } from 'fs-extra'
import prompts from 'prompts'

import { mioDeps, installDependencies } from './install'
import { start } from './start'
import { exitHandler } from '..'
import { pkg } from '../templates/package-json'
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
      message: 'Bot QQ 账号',
      validate: (input) => {
        return /^[1-9]\d{4,9}$/.test(input.trim()) ? true : '无效的 QQ 账号'
      },
      format: (e) => Number(e.trim())
    },
    {
      name: 'platform',
      type: 'select',
      message: '登录协议',
      initial: 0,
      choices: [
        {
          title: 'iPad（苹果平板，推荐，可多设备同时在线）',
          value: 5
        },
        {
          title: 'aPhone（安卓手机）',
          value: 1
        },
        {
          title: 'APad（安卓平板）',
          value: 2
        },
        {
          title: 'MacOS（苹果电脑）',
          value: 4
        },
        {
          title: 'aWatch（安卓手表）',
          value: 3
        }
      ]
    },
    {
      name: 'admins',
      type: isSwitch ? null : 'list',
      message: 'Bot 管理员',
      separator: ' ',
      format: (list: string[]) => [...new Set(list.filter((e) => !!e).map(Number))],
      validate: (list: string) => {
        return /^[1-9]\d{4,9}(\s+[1-9]\d{4,9})*$/.test(list.trim()) ? true : '无效的管理员 QQ 账号'
      }
    },
    {
      name: 'login_mode',
      type: 'select',
      message: '登录模式',
      initial: 0,
      choices: [
        {
          title: '密码登录（推荐服务器使用）',
          value: 'password'
        },
        {
          title: '扫码登录（存在 IP 限制，推荐本地使用）',
          value: 'qrcode'
        }
      ]
    },
    {
      name: 'password',
      type: (login_mode) => {
        return login_mode === 'password' ? 'text' : null
      },
      message: 'Bot 账号密码',
      style: 'password',
      validate: (password) => {
        return /^.{6,16}$/.test(password.trim()) ? true : '无效的密码'
      },
      format: (password) => password.trim()
    },
    {
      name: 'device_mode',
      type: (prev) => {
        return prev === 'qrcode' ? null : 'select'
      },
      initial: 0,
      message: '设备锁验证模式',
      choices: [
        {
          title: '短信验证码',
          value: 'sms'
        },
        {
          title: '二维码',
          value: 'qrcode'
        }
      ]
    }
  ] as PromptObject[]
}

export async function init(args: ParsedArgs) {
  const isDev = args.dev
  const isForce = args.force
  const isSwitch = args.switch
  const log_level = args.log_level
  const needStart = args.start

  const config: any = {}

  if (fs.existsSync(ConfigPath)) {
    if (!isForce && !isSwitch) {
      const tips = [
        '配置文件 mio.json 已存在',
        '--switch 切换账号（保留插件和通知配置）',
        '--force 覆盖并重新配置'
      ]

      notice.warn(tips.join('，'))
      process.exit(0)
    }

    if (isSwitch) {
      Object.assign(config, fs.readJsonSync(ConfigPath))
      Object.assign(pkg, fs.readJsonSync(PkgPath))
    }
  }

  const answer = await prompts(getQuestions(isSwitch ? 'switch' : 'init'))

  answer.password ??= ''
  answer.device_mode ??= 'sms'

  if (!answer.login_mode || (answer.login_mode === 'password' && !answer.password)) {
    notice.warn('退出 miobot')
    process.exit(0)
  }

  const level = typeof log_level === 'string' ? log_level : isDev ? 'debug' : 'info'

  const isOK = writeMioConf({
    account: answer.account,
    login_mode: answer.login_mode,
    device_mode: answer.device_mode,
    message_mode: config?.message_mode ?? (isDev ? 'detail' : 'short'),
    password: base64encode(answer.password),
    log_level: config?.log_level ?? level,
    admins: config?.admins ?? answer.admins,
    plugins: config?.plugins ?? [],
    notice: config?.notice ?? DefaultNoticeConfig,
    oicq_config: {
      log_level: level,
      ...(config?.oicq_config ?? {}),
      platform: answer.platform
    }
  })

  writeFileSync(AppPath, "require('miobot').start()")
  writeFileSync(PkgPath, pkg)

  const files = ['mio.json', 'app.js', 'package.json'].map(colors.cyan)

  if (isOK) {
    notice.success(`创建文件: ${files.join(', ')}`)

    if (needStart) {
      await installDependencies(mioDeps)
    }

    if (needStart) {
      process.off('SIGINT', exitHandler)
      await start()
    }
  } else {
    notice.error('配置文件和入口文件写入失败')
    process.exit(1)
  }
}

const tips = [
  '--start 配置完立即安装依赖并启动',
  '--switch 切换账号（保留插件和通知配置）',
  '--force 覆盖并重新配置',
  '--dev 开发模式，自动配置 log_level 为 debug',
  '--log 手动指定启动的 log_level (info debug off)'
]

init.help = `
      init\t初始化框架，引导生成配置文件和入口文件，${tips.join(',')}`

function writeMioConf(conf: Record<string, any>) {
  try {
    fs.writeJsonSync(ConfigPath, conf, { spaces: 2 })
    return true
  } catch {
    return false
  }
}
