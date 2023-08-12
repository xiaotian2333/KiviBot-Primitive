import { wait } from '@kivi-dev/shared'
import dayjs from 'dayjs'
import { createClient } from 'icqq'
import kleur from 'kleur'
import path from 'node:path'
import prompts from 'prompts'

import { resolveConfig } from './config.js'
import { SIGN_API_ADDR } from './constants.js'
import { Logger } from './logger.js'

import type { BotConfig, Platform as KiviPlatform } from '@kivi-dev/types'
import type { Client, Platform as IcqqPlatform } from 'icqq'

export default class KiviClient {
  #rootDir = process.cwd()
  #logger: Logger = new Logger('KiviClient')
  #loggers: Map<number, Logger> = new Map()
  #oicqBotClients: Map<number, Client> = new Map()
  #botConfigs: BotConfig[] = []
  #first = false

  constructor(config?: BotConfig[]) {
    this.#logger.setLevel('info')

    const tip = `   KiviBot v1.0   `
    const infos = [
      '',
      `${kleur.bgBlack().black(tip)}`,
      `${kleur.bgBlack().green().bold(tip)}`,
      `${kleur.bgBlack().black(tip)}`,
      '',
    ]

    console.info(infos.join('\n'))

    this.#logger.debug('初始化 Kivi Client 实例')

    if (config && config.length) {
      this.#logger.debug('检测到 config，将使用传入的 config 作为配置启动')
      this.#botConfigs = config
    }

    const handleException = (e: any) => {
      console.info('213123123')
      this.#logger.error('发生了错误: ', e?.message || JSON.stringify(e) || e)
    }

    process.on('SIGINT', () => {
      this.#logger.fatal('已退出 Kivi')
      process.exit(0)
    })

    process.on('uncaughtException', handleException)
    process.on('unhandledRejection', handleException)
  }

  async start(dir?: string) {
    this.#logger.debug('读取 Kivi 配置目录')

    this.#rootDir = dir || this.#rootDir

    if (!this.#botConfigs.length) {
      this.#logger.debug('解析已配置的 Bot 列表')
      this.#botConfigs = resolveConfig(this.#rootDir)
    }

    if (!this.#botConfigs.length) {
      throw new Error('请先在 kivi.json 中配置机器人')
    }

    this.#logger.info(`共检测到 ${kleur.magenta(this.#botConfigs.length)} 个 Bot 账号`)

    for (const { uin, platform, password, oicq_config } of this.#botConfigs) {
      if (this.#first) {
        this.#pickLogger(uin).info('为降低风险，延迟 3s 再登录 ' + kleur.green(uin))
        await wait(10000)
      }

      this.#first = true
      this.#logger.info('准备登录 Bot ' + kleur.green(uin))

      const botDataDir = path.join(this.#rootDir, 'data', String(uin))
      const relativeBotDataDir = `./${path.relative(process.cwd(), botDataDir)}`
      this.#pickLogger(uin).info('Bot 数据目录:', kleur.green(relativeBotDataDir))
      this.#pickLogger(uin).debug(`初始化 oicq Client `)

      const bot = createClient({
        ...(oicq_config || {}),
        data_dir: botDataDir,
        auto_server: true,
        platform: this.#mapPlatformToOicq(platform || 1),
        sign_api_addr: SIGN_API_ADDR,
        log_config: this.#getLogConfig(uin),
      })

      this.#pickLogger(uin).debug(`监听并处理 Bot 登录事件`)

      this.#oicqBotClients.set(uin, bot)
      this.#bindLoginEvents(bot)

      this.#pickLogger(uin).info(`使用协议 ${kleur.green(`${bot.apk.display}_${bot.apk.version}`)}`)
      this.#pickLogger(uin).info(`登录 Bot ` + kleur.green(uin))
      this.#pickLogger(uin).info(`正在解析登录服务器...`)
      await bot.login(uin, password)
    }
  }

  async #bindLoginEvents(bot: Client) {
    bot.on('internal.sso', (payload) => {
      this.#pickLogger(bot).info(payload)
    })

    bot.on('internal.input', (payload) => {
      this.#pickLogger(bot).info(payload)
    })

    bot.on('system.login.device', async (payload) => {
      if (payload.url) {
        this.#pickLogger(bot).info(
          `请复制链接到浏览器进行设备锁验证:\n\n${kleur.cyan(payload.url)}\n`
        )
      } else {
        const { confirm } = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: `需要验证设备锁，是否向手机 ${kleur.cyan(payload.phone)} 发送验证码？`,
        })

        if (confirm) {
          await bot.sendSmsCode()
        } else {
          this.#pickLogger(bot).info(`已取消发送验证码`)
        }

        const { code } = await prompts({
          name: 'code',
          type: 'text',
          validate: (code) => (code ? true : '验证码不为空'),
          message: `验证码已发送至 ${kleur.cyan(payload.phone)}，请输入验证码`,
        })

        if (code) {
          await bot.submitSmsCode(code)
        }
      }
    })

    bot.on('system.login.slider', async (payload) => {
      const infos = [
        '请复制链接到浏览器进行滑块认证:',
        kleur.cyan(payload.url),
        '请输入获取到的 ticket:\n',
      ]

      this.#pickLogger(bot).info(infos.join('\n\n'))

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
    })

    bot.on('system.login.error', (payload) => {
      this.#pickLogger(bot).fatal(payload.message)
      process.exit(-1)
    })
  }

  // kivi to oicq 的 platform 映射
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
