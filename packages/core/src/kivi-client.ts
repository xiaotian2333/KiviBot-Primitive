import { showLogo } from '@kivi-dev/shared'
import dayjs from 'dayjs'
import { createClient } from 'icqq'
import kleur from 'kleur'
import path from 'node:path'
import prompts from 'prompts'

import { resolveConfig } from './config.js'
import { SIGN_API_ADDR } from './constants.js'
import { Logger } from './logger.js'
import { handleException } from './utils.js'

import type { BotConfig, Platform as KiviPlatform } from '@kivi-dev/types'
import type { Client, Platform as IcqqPlatform } from 'icqq'

export default class KiviClient {
  #rootDir = process.cwd()
  #mainLogger: Logger = new Logger('KiviClient')
  #loggers: Map<number, Logger> = new Map()
  #oicqClient?: Client
  #botConfig?: BotConfig

  constructor(config?: BotConfig) {
    showLogo()

    this.#mainLogger.setLevel('info')
    this.#mainLogger.debug('初始化 Kivi Client 实例')

    if (config) {
      this.#mainLogger.debug('检测到 config，将使用传入的 config 作为配置启动')
      this.#botConfig = config
    }

    handleException(this.#mainLogger)
  }

  async start(dir?: string) {
    this.#initKivi(dir)
    this.#createBotClient(this.#botConfig!)
  }

  async #initKivi(dir?: string) {
    this.#mainLogger.debug('读取 Kivi 配置目录')

    this.#rootDir = dir || this.#rootDir

    if (!this.#botConfig) {
      this.#mainLogger.debug('解析 Bot 配置文件')
      this.#botConfig = resolveConfig(this.#rootDir)
    }
  }

  async #createBotClient(config: BotConfig) {
    const { uin, platform, password, oicq_config } = config

    this.#mainLogger.info('准备登录 Bot ' + kleur.green(uin))

    const botDataDir = path.join(this.#rootDir, 'data', String(uin))
    const relativeBotDataDir = `./${path.relative(process.cwd(), botDataDir)}`

    this.#pickLogger(uin).info('Bot 数据目录:', kleur.green(relativeBotDataDir))
    this.#pickLogger(uin).debug(`初始化 oicq Client `)

    this.#oicqClient = createClient({
      ...(oicq_config || {}),
      data_dir: botDataDir,
      auto_server: true,
      platform: this.#mapPlatformToOicq(platform || 1),
      sign_api_addr: SIGN_API_ADDR,
      log_config: this.#getLogConfig(uin),
    })

    this.#pickLogger(uin).debug(`监听并处理 Bot 登录事件`)
    this.#bindLoginEvents(this.#oicqClient)

    const { display, version } = this.#oicqClient.apk

    this.#pickLogger(uin).info(`开始登录 Bot ` + kleur.green(uin))
    this.#pickLogger(uin).info(`使用协议 ${kleur.green(`${display}_${version}`)}`)
    this.#pickLogger(uin).info(`正在解析并登录服务器...`)

    await this.#oicqClient.login(uin, password)
  }

  async #bindLoginEvents(bot: Client) {
    bot.on('internal.sso', (p) => this.#pickLogger(bot).debug('internal.sso: ' + p))
    bot.on('internal.input', (p) => this.#pickLogger(bot).debug('internal.input: ' + p))

    bot.on('system.login.error', (p) => this.#handleLoginError(bot, p))
    bot.on('system.login.device', (p) => this.#handleDeviceLogin(bot, p))
    bot.on('system.login.slider', (p) => this.#handleSliderVerify(bot, p.url))

    bot.once('system.online', (p) => this.#handleOnLogin(bot))
  }

  #handleLoginError(bot: Client, p: { message: string }) {
    this.#pickLogger(bot).fatal(p.message)
    process.exit(-1)
  }

  #handleOnLogin(bot: Client) {
    const welcome = `${bot.nickname}(${bot.uin}) 上线成功! `
    this.#pickLogger(bot).info(kleur.green(welcome))
    this.#pickLogger(bot).info('向 Bot 发送 .help 查看所有命令')

    const mainAdmin = this.#oicqClient!.pickFriend(this.#botConfig!.admins[0])
    mainAdmin.sendMsg('✅ 已上线，发送 .help 查看命令')
  }

  #handleDeviceLogin(bot: Client, p: { url: string; phone: string }) {
    const useSms = this.#botConfig?.deviceMode !== 'qrcode'

    if (useSms) {
      this.#handleSmsDeviceLogin(bot, p.phone)
    } else {
      this.#handleQrcodeDeviceLogin(bot, p.url)
    }
  }

  #handleSliderVerify(bot: Client, url: string) {
    const infos = [
      kleur.yellow('请复制下面的链接到浏览器进行滑块认证'),
      kleur.cyan(url),
      kleur.white('请输入获取到的 ticket，并按回车键确认:\n'),
    ]

    this.#pickLogger(bot).info(infos.join('\n\n'))
    this.#inputAndSubmitTicket(bot)
  }

  #inputAndSubmitTicket(bot: Client) {
    const inputTicket = () => {
      process.stdin.once('data', async (data: Buffer) => {
        const ticket = String(data).trim()
        if (!ticket) return inputTicket()
        console.log()
        this.#pickLogger(bot).info('ticket 已提交，等待响应...')
        await bot.submitSlider(ticket)
      })
    }

    inputTicket()
  }

  async #handleSmsDeviceLogin(bot: Client, phone: string) {
    await prompts({
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `需要验证设备锁，按回车键向 ${kleur.cyan(phone)} 发送短信验证码`,
    })

    const { code } = await prompts({
      name: 'code',
      type: 'text',
      validate: (code) => (code ? true : '验证码不为空'),
      message: `验证码已发送至 ${kleur.cyan(phone)}，请输入验证码`,
    })

    await bot.submitSmsCode(code)
  }

  async #handleQrcodeDeviceLogin(bot: Client, url: string) {
    this.#pickLogger(bot).info(`请复制下面的链接到浏览器进行设备锁验证\n\n${kleur.cyan(url)}\n`)

    await prompts({
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `请在设备锁验证完成后，按回车键继续`,
    })

    await bot.login()
  }

  // kivi to oicq/icqq 的 platform 映射
  #mapPlatformToOicq(platform: KiviPlatform) {
    // oicq 登录协议：1 为安卓手机, 2 为安卓平板, 3 为安卓手表, 4 为 MacOS, 5 为 iPad
    // kivi 登录协议：1 为平板，2 为手机，3 为 PC，4 为手表，5 为备选，Tim 或者旧安卓，对应 oicq 的协议 6
    return [null, 2, 1, 4, 3, 6][platform] as IcqqPlatform
  }

  #pickLogger(uin: number | string | Client) {
    if (typeof uin !== 'number') {
      uin = Number(typeof uin === 'string' ? uin : uin.uin)
    }

    if (this.#loggers.has(uin)) {
      return this.#loggers.get(uin) as Logger
    } else {
      const logger = new Logger(String(uin))
      this.#loggers.set(uin, logger)
      return logger
    }
  }

  #getLogConfig(uin: number) {
    // 定义输出文件名和路径
    // ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
    const now = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    const filename = `kivi_${uin}_${now}`
    const botLogDir = path.join(this.#rootDir, 'logs', String(uin))
    const logFilePath = path.join(botLogDir, `${filename}.log`)

    return {
      appenders: {
        log_file: {
          type: 'file',
          filename: logFilePath,
          maxLogSize: 1024 * 1024 * 10, // 10MB
          compress: false,
          backups: 3,
          encoding: 'utf-8',
        },
      },
      categories: {
        default: {
          appenders: ['log_file'],
          level: 'all',
        },
      },
    }
  }
}
