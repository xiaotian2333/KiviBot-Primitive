import { b, searchAllPlugins, showLogo } from '@kivi-dev/shared'
import dayjs from 'dayjs'
import { createClient } from 'icqq'
import kleur from 'kleur'
import mri from 'mri'
import fs from 'node:fs'
import path from 'node:path'
import { watch, ref } from 'obj-observer'
import prompts from 'prompts'
import { str2argv } from 'string2argv'

import command from './commands.js'
import { resolveConfig } from './config.js'
import { CONFIG_FILE_NAME, DEFAULT_SIGN_API } from './constants.js'
import { Logger } from './logger.js'
import { deepClone, handleException, loadModule, require, stringifySendable } from './utils.js'

import type { Plugin } from '@kivi-dev/plugin'
import type { AllMessageEvent, BotConfig, ClientWithApis } from '@kivi-dev/types'
import type { Client, Friend, Group, Quotable, Sendable } from 'icqq'

export default class KiviClient {
  #cwd = process.cwd()
  #mainLogger: Logger = new Logger('Client')
  #loggers: Map<string, Logger> = new Map()
  #bot?: ClientWithApis
  #botConfig?: BotConfig
  #plugins: Map<string, Plugin> = new Map()

  constructor(config?: BotConfig) {
    showLogo(require('../package.json')?.version)

    this.#mainLogger.setLevel('debug')
    this.#mainLogger.debug('初始化 Kivi Client 实例')

    if (config) {
      this.#mainLogger.debug('检测到 config，将使用传入的 config 作为配置启动')
      this.#botConfig = ref<BotConfig>(config)
      watch(this.#botConfig, (config) => this.#handleConfigChange(config))
    }

    handleException(this.#mainLogger)
  }

  #handleConfigChange(config: BotConfig) {
    const filePath = path.join(this.#cwd, CONFIG_FILE_NAME)
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
    this.#mainLogger.debug('检测到 config 变更，已自动保存')
  }

  async start(dir?: string) {
    this.#initKivi(dir)
    this.#createBotClient(this.#botConfig!)
  }

  get KiviClientConfig() {
    return {
      botConfig: this.#botConfig,
      cwd: this.#cwd,
      bot: this.#bot,
      mainLogger: this.#mainLogger,
      loggers: this.#loggers,
    }
  }

  get plugins() {
    return this.#plugins
  }

  get bot() {
    return this.#bot
  }

  async #initKivi(dir?: string) {
    this.#mainLogger.debug('读取 Kivi 配置目录')

    this.#cwd = dir || this.#cwd

    if (!this.#botConfig) {
      this.#mainLogger.debug('解析 Bot 配置文件')
      this.#botConfig = ref<BotConfig>(resolveConfig(this.#cwd))
      watch(this.#botConfig, (config) => this.#handleConfigChange(config))
    }
  }

  async #createBotClient(config: BotConfig) {
    const { uin, platform, password, oicq_config, log_level = 'debug' } = config

    this.#mainLogger.setLevel(log_level)
    this.#mainLogger.info('准备登录 Bot ' + b(uin))

    const botDataDir = path.join(this.#cwd, 'data/oicq')
    const relativeBotDataDir = `./${path.relative(process.cwd(), botDataDir)}`

    this.#mainLogger.info('Bot 数据目录:', b(relativeBotDataDir))
    this.#mainLogger.debug(`初始化 oicq Client `)

    const bot = createClient({
      platform: platform || 2,
      auto_server: true,
      sign_api_addr: oicq_config?.sign_api_addr || DEFAULT_SIGN_API,
      ...(oicq_config || {}),
      log_config: this.#getLogConfig(uin),
      data_dir: botDataDir,
    })

    this.#bot = Object.assign(bot, { apis: {} }) as unknown as ClientWithApis

    this.#mainLogger.debug(`监听并处理 Bot 登录事件`)
    this.#bindLoginEvents(this.#bot)

    const { display, version } = this.#bot.apk

    this.#mainLogger.info(`开始登录 Bot ` + b(uin))
    this.#mainLogger.info(`使用协议 ${b(`${display}_${version}`)}`)
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

    this.#mainLogger.info(`开始加载插件...`)
    await this.#loadPlugins()

    const welcome = `${this.#bot!.nickname}(${this.#bot!.uin}) 上线成功! `
    this.#mainLogger.info(kleur.green(welcome))
    this.#mainLogger.info(`向 ${b(`Bot`)} 发送 ${b(`.help`)} 查看所有命令`)

    const mainAdmin = this.#bot!.pickFriend(this.#botConfig!.admins[0])
    mainAdmin.sendMsg('✅ 上线成功，发送 .h 查看帮助')
  }

  async #loadPlugins() {
    const plugins = await searchAllPlugins(this.#cwd)
    const size = plugins.length
    const onSize = this.#botConfig?.plugins?.length || 0

    this.#mainLogger.info(
      size ? `检测到 ${b(String(size))} 个插件，${b(String(onSize))} 个已开启` : '未检测到任何插件',
    )

    return Promise.all(
      plugins
        .filter((p) => this.#botConfig?.plugins?.includes(p.name))
        .map(async (plugin) => {
          const relativePath = './' + path.relative(this.#cwd, plugin.path)
          this.#mainLogger.info(b(`启用插件 ${plugin.name} -> ${relativePath}`))

          const pluginInstance = await this.enablePlugin(plugin)

          if (!pluginInstance) {
            this.#mainLogger.error(`插件 ${b(plugin.name)} 启用失败`)
          } else {
            this.#plugins?.set(plugin.name, pluginInstance)
          }
        }),
    )
  }

  async enablePlugin(pluginInfo: { name: string; path: string; pkg: Record<string, any> }) {
    let res

    try {
      res = loadModule(`${pluginInfo.path}/index`)
    } catch (e) {
      try {
        res = loadModule(`${pluginInfo.path}/src/index`)
      } catch (e) {
        const exports =
          pluginInfo.pkg?.exports ||
          pluginInfo.pkg?.exports['.'] ||
          pluginInfo.pkg?.exports['.']?.import ||
          pluginInfo.pkg?.exports['.']?.require ||
          pluginInfo.pkg?.exports['.']?.default

        const entry = pluginInfo.pkg?.main || pluginInfo.pkg?.module || exports

        try {
          res = loadModule(path.join(pluginInfo.path, entry))
        } catch {
          const info = `未找到插件 ${b(pluginInfo.name)} 入口，启用失败`
          this.#mainLogger.error(info)
          return info
        }
      }
    }

    const plugin = res?.plugin || res?.default?.plugin

    if (!plugin || !plugin.init) {
      const info = `插件 ${b(pluginInfo.name)} 未导出 ${b('`plugin`')} 实例，启用失败`
      this.#mainLogger.error(info)
      return info
    } else {
      try {
        await plugin.init(this.#bot!, deepClone(this.#botConfig), this.#cwd)

        this.#plugins?.set(pluginInfo.name, plugin)
        return plugin
      } catch (e: any) {
        const err = e?.message || JSON.stringify(e)
        const info = `插件 ${b(pluginInfo.name)} 启用失败，错误信息：` + err
        this.#mainLogger.error(info)
        return info
      }
    }
  }

  async disablePlugin(pluginName: string) {
    const plugin = this.#plugins?.get(pluginName)

    if (!plugin) {
      const err = `插件 ${b(pluginName)} 未启用`
      this.#mainLogger.warn(err)
      return err
    }

    try {
      await plugin.destroy()

      this.#plugins?.delete(pluginName)

      return true
    } catch (e: any) {
      return e.message || JSON.stringify(e)
    }
  }

  async reloadPlugin(pluginName: string) {
    const isOffOK = await this.disablePlugin(pluginName)
    const plugins = await searchAllPlugins(this.#cwd)
    const plugin = plugins.find((p) => p.name === pluginName)

    if (!plugin) {
      const info = `插件 ${b(pluginName)} 不存在`
      this.#mainLogger.info(info)
      return info
    }

    const isOnOK = await this.enablePlugin(plugin)
    const isOK = isOffOK === true && isOnOK && typeof isOnOK !== 'string'

    return isOK ? true : isOffOK && isOnOK
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

    this.#mainLogger.info(`${kleur.dim(head)} ${message}`)
  }

  async #handleFrameworkCommand(event: AllMessageEvent) {
    const msg = event.toString().trim()

    // 过滤非 . 开头的消息
    if (!/^\s*\.\w+/i.test(msg)) return

    const { _: params, ...options } = mri(str2argv(msg))
    const cmd = params.shift()?.replace(/^\s*\./, '') ?? ''

    // 是否是管理员
    const isAdmin = this.#botConfig!.admins.includes(event.sender.user_id)

    // 过滤非管理员消息
    if (!isAdmin) return

    command.bindEvent(event)
    await command.parse(cmd, params, options, this)
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

    const showKeliLog = (content: Sendable) => {
      return this.#mainLogger.info(kleur.dim(`${head} ${kleur.reset(stringifySendable(content))}`))
    }

    target.sendMsg = async function (content: Sendable, source?: Quotable | undefined) {
      const res = await sendMsg(content, source)

      showKeliLog(content)

      return res
    }
  }

  #handleDeviceLogin(p: { url: string; phone: string }) {
    const useSms = this.#botConfig?.device_mode !== 'qrcode'

    if (useSms) {
      this.#handleSmsDeviceLogin(this.#bot!, p.phone)
    } else {
      this.#handleQrcodeDeviceLogin(this.#bot!, p.url)
    }
  }

  #handleSliderVerify(url: string) {
    const infos = [
      kleur.yellow('请复制下面的链接到浏览器进行滑块认证'),
      b(url),
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

        this.#mainLogger.info(`\n${b('ticket')} 已提交，等待响应...`)
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
      message: `需要验证设备锁，按回车键向 ${b(phone)} 发送短信验证码`,
    })

    await bot.sendSmsCode()

    const { code } = await prompts({
      name: 'code',
      type: 'text',
      validate: (code) => (code ? true : '验证码不为空'),
      message: `验证码已发送至 ${b(phone)}，请输入验证码`,
    })

    this.#mainLogger.info('\n短信验证码已提交，等待响应...')

    await bot.submitSmsCode(code)
  }

  async #handleQrcodeDeviceLogin(bot: Client, url: string) {
    this.#mainLogger.info(`请复制下面的链接到浏览器进行设备锁验证\n\n${b(url)}\n`)

    await prompts({
      type: 'confirm',
      name: 'confirm',
      initial: true,
      message: `请在设备锁验证完成后，按回车键继续`,
    })

    await bot.login()
  }

  #getLogConfig(uin: number) {
    // 定义输出文件名和路径
    // ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
    const now = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    const filename = `kivi_${uin}_${now}`
    const botLogDir = path.join(this.#cwd, 'logs', String(uin))
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
