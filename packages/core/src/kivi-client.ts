import { ensureArray, searchAllPlugins, showLogo } from '@kivi-dev/shared'
import dayjs from 'dayjs'
import { createClient } from 'icqq'
import kleur from 'kleur'
import mri from 'mri'
import path from 'node:path'
import prompts from 'prompts'
import { str2argv } from 'string2argv'

import command from './commands.js'
import { resolveConfig } from './config.js'
import { SIGN_API_ADDR } from './constants.js'
import { Logger } from './logger.js'
import { handleException, loadModule } from './utils.js'

import type {
  AllMessageEvent,
  BotConfig,
  ClientWithApis,
  Platform as KiviPlatform,
} from '@kivi-dev/types'
import type {
  Client,
  Friend,
  Group,
  Platform as IcqqPlatform,
  MessageElem,
  Quotable,
  Sendable,
} from 'icqq'

export default class KiviClient {
  #rootDir = process.cwd()
  #mainLogger: Logger = new Logger('KiviClient')
  #loggers: Map<string, Logger> = new Map()
  #bot?: ClientWithApis
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

    this.#mainLogger.info('Bot 数据目录:', kleur.green(relativeBotDataDir))
    this.#mainLogger.debug(`初始化 oicq Client `)

    const bot = createClient({
      ...(oicq_config || {}),
      data_dir: botDataDir,
      auto_server: true,
      platform: this.#mapPlatformToOicq(platform || 1),
      sign_api_addr: SIGN_API_ADDR,
      log_config: this.#getLogConfig(uin),
    })

    this.#bot = Object.assign(bot, { apis: {} })

    this.#mainLogger.debug(`监听并处理 Bot 登录事件`)
    this.#bindLoginEvents(this.#bot)

    const { display, version } = this.#bot.apk

    this.#mainLogger.info(`开始登录 Bot ` + kleur.green(uin))
    this.#mainLogger.info(`使用协议 ${kleur.green(`${display}_${version}`)}`)
    this.#mainLogger.info(`正在解析并登录服务器...`)

    await this.#bot.login(uin, password)
  }

  async #bindLoginEvents(bot: ClientWithApis) {
    // bot.on('internal.sso', (p) => this.#mainLogger.debug('internal.sso: ' + p))
    // bot.on('internal.input', (p) => this.#mainLogger.debug('internal.input: ' + p))

    bot.on('system.login.error', (p) => this.#handleLoginError(p))
    bot.on('system.login.device', (p) => this.#handleDeviceLogin(p))
    bot.on('system.login.slider', (p) => this.#handleSliderVerify(p.url))

    bot.once('system.online', () => this.#handleOnLogin())
  }

  #handleLoginError(p: { message: string; code: number }) {
    this.#mainLogger.fatal(`[错误码 ${p.code}] ${p.message}`)
    process.exit(-1)
  }

  async #handleOnLogin() {
    this.#bindSendMsg()
    this.#handleMessageForFramework()

    await this.#loadPlugins()

    const welcome = `${this.#bot!.nickname}(${this.#bot!.uin}) 上线成功! `
    this.#mainLogger.info(kleur.green(welcome))
    this.#mainLogger.info('向 Bot 发送 .help 查看所有命令')

    const mainAdmin = this.#bot!.pickFriend(this.#botConfig!.admins[0])
    mainAdmin.sendMsg('✅ 已上线，发送 .help 查看命令')
  }

  async #loadPlugins() {
    const plugins = await searchAllPlugins(this.#rootDir)

    return Promise.all(
      plugins
        .filter((p) => this.#botConfig?.plugins?.includes(p))
        .map((plugin) => this.#enablePlugin(plugin)),
    )
  }

  async #enablePlugin(pluginInfo: { path: string; pkg: Record<string, any> }) {
    let res

    try {
      res = loadModule(`${pluginInfo.path}/index`)
    } catch {
      try {
        res = loadModule(`${pluginInfo.path}/src/index`)
      } catch {
        const exports =
          pluginInfo.pkg?.exports ||
          pluginInfo.pkg?.exports['.'] ||
          pluginInfo.pkg?.exports['.']?.import ||
          pluginInfo.pkg?.exports['.']?.require ||
          pluginInfo.pkg?.exports['.']?.default

        res = loadModule(
          path.join(pluginInfo.path, pluginInfo.pkg?.main || pluginInfo.pkg?.module || exports),
        )
      }
    }

    const plugin = res?.plugin || res?.default?.plugin

    if (!plugin || !plugin.init) {
      throw new Error('插件未导出 `plugin`')
    } else {
      try {
        plugin.init(this.#bot!, structuredClone(this.#botConfig), this.#rootDir)
      } catch (e: any) {
        this.#mainLogger.error('插件启用失败，报错信息：' + e?.message || JSON.stringify(e))
      }
    }
  }

  #handleMessageForFramework() {
    this.#bot!.on('message', (event: AllMessageEvent) => {
      this.#handleLogOutput(event)
      this.#handleFrameworkCommand(event)
    })
  }

  #handleLogOutput(event: AllMessageEvent) {
    const { sender, message_type } = event

    const TypeMap = {
      private: 'P',
      group: 'G',
      discuss: 'D',
    } as const

    const type = TypeMap[event.message_type]
    const nick = `${sender.nickname}(${sender.user_id})`

    let head: string

    if (message_type === 'private') {
      // 私聊消息
      head = `↓ [${type}:${nick}]`
    } else if (message_type === 'discuss') {
      // 讨论组消息
      const discuss = `${event.discuss_name}(${event.discuss_id})`
      head = `↓ [${type}:${discuss}:${nick}]`
    } else {
      // 群聊消息
      const group = `${event.group_name}(${event.group_id})`
      head = `↓ [${type}:${group}-${nick}]`
    }

    const message = event.toString()

    this.#mainLogger.info(`${kleur.gray(head)} ${message}`)
  }

  #handleFrameworkCommand(event: AllMessageEvent) {
    const msg = event.toString().trim()

    // 过滤非 . 开头的消息
    if (!/^\s*\.\w+/i.test(msg)) return

    const { _: params, ...options } = mri(str2argv(msg))
    const cmd = params.shift()?.replace(/^\s*\./, '') ?? ''

    // 是否是管理员
    const isAdmin = this.#botConfig!.admins.includes(event.sender.user_id)
    // 是否是主管理员
    const isMainAdmin = this.#botConfig!.admins[0] === event.sender.user_id

    // 过滤非管理员消息
    if (!isAdmin) return

    command.bindEvent(event)
    command.parse(cmd, params, options, isMainAdmin)
  }

  #bindSendMsg() {
    for (const [gid, { group_name = 'unknown' }] of this.#bot!.gl) {
      const group = this.#bot!.pickGroup(gid)
      const head = `↑ [G:${group_name}(${gid})]`
      this.#bindSend(group, head)
    }

    for (const [qq, { nickname = 'unknown' }] of this.#bot!.fl) {
      const friend = this.#bot!.pickFriend(qq)
      const head = `↑ [P:${nickname}(${qq})]`
      this.#bindSend(friend, head)
    }

    this.#bot!.on('notice.group.increase', ({ group, user_id }) => {
      if (user_id !== this.#bot!.uin) return
      const { group_id, name = 'unknown' } = group
      const head = `↑ [G:${name}(${group_id})]`
      this.#bindSend(group, head)
    })

    this.#bot!.on('notice.friend.increase', ({ friend }) => {
      const { user_id, nickname = 'unknown' } = friend
      const head = `↑ [P:${nickname}(${user_id})]`
      this.#bindSend(friend, head)
    })
  }

  #bindSend(target: Group | Friend, head: string) {
    const sendMsg = target.sendMsg.bind(target)

    function stringifySendable(content: Sendable) {
      return ensureArray(content)
        .map((message) => (typeof message === 'string' ? message : JSON.stringify(message)))
        .join('')
    }

    const showKeliLog = (content: Sendable) => {
      return this.#mainLogger.info(kleur.gray(`${head} ${stringifySendable(content)}`))
    }

    target.sendMsg = async function (content: Sendable, source?: Quotable | undefined) {
      showKeliLog(content)

      return sendMsg(content, source)
    }
  }

  #handleDeviceLogin(p: { url: string; phone: string }) {
    const useSms = this.#botConfig?.deviceMode !== 'qrcode'

    if (useSms) {
      this.#handleSmsDeviceLogin(this.#bot!, p.phone)
    } else {
      this.#handleQrcodeDeviceLogin(this.#bot!, p.url)
    }
  }

  #handleSliderVerify(url: string) {
    const infos = [
      kleur.yellow('请复制下面的链接到浏览器进行滑块认证'),
      kleur.cyan(url),
      kleur.white('请输入获取到的 ticket，并按回车键确认:\n'),
    ]

    this.#mainLogger.info(infos.join('\n\n'))
    this.#inputAndSubmitTicket(this.#bot!)
  }

  #inputAndSubmitTicket(bot: Client) {
    const inputTicket = () => {
      process.stdin.once('data', async (data: Buffer) => {
        const ticket = String(data).trim()

        if (!ticket) {
          return inputTicket()
        }

        this.#mainLogger.info('\nticket 已提交，等待响应...')
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

    await bot.sendSmsCode()

    const { code } = await prompts({
      name: 'code',
      type: 'text',
      validate: (code) => (code ? true : '验证码不为空'),
      message: `验证码已发送至 ${kleur.cyan(phone)}，请输入验证码`,
    })

    this.#mainLogger.info('\n短信验证码已提交，等待响应...')

    await bot.submitSmsCode(code)
  }

  async #handleQrcodeDeviceLogin(bot: Client, url: string) {
    this.#mainLogger.info(`请复制下面的链接到浏览器进行设备锁验证\n\n${kleur.cyan(url)}\n`)

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

  #pickLogger(pluginName: string) {
    if (this.#loggers.has(pluginName)) {
      return this.#loggers.get(pluginName) as Logger
    } else {
      const logger = new Logger(String(pluginName))
      this.#loggers.set(pluginName, logger)
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
