import dayjs from 'dayjs'
import kleur from 'kleur'

import type { Level } from '@kivi-dev/types'
export class Logger {
  #level = 0
  #name = ''
  #levels = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  }

  constructor(name?: string | number) {
    if (name) this.#name = String(name)
  }

  get prefix() {
    const time = kleur.green(`[${dayjs().format('MM/DD HH:mm:ss')}]`)
    return time + (this.#name ? kleur.dim(` [${this.#name}]`) : '')
  }

  setLevel(level: Level) {
    this.#level = this.#levels[level]
  }

  setName(name: string) {
    this.#name = name
  }

  getLogger(name: string) {
    const logger = new Logger()
    logger.setName(name)
    return logger
  }

  trace(...args: any[]) {
    if (this.#level <= this.#levels.trace) {
      console.log(this.prefix + kleur.gray(' [TRACE]'), ...args)
    }
  }

  debug(...args: any[]) {
    if (this.#level <= this.#levels.debug) {
      console.log(this.prefix + kleur.cyan(' [DEBUG]'), ...args)
    }
  }

  info(...args: any[]) {
    if (this.#level <= this.#levels.info) {
      console.log(this.prefix + kleur.green(' [INFO]'), ...args)
    }
  }

  log(...args: any[]) {
    return this.info(...args)
  }

  warn(...args: any[]) {
    if (this.#level <= this.#levels.warn) {
      console.log(this.prefix + kleur.yellow(' [WARN]'), ...args)
    }
  }

  error(...args: any[]) {
    if (this.#level <= this.#levels.error) {
      console.log(this.prefix + kleur.red(' [ERROR]'), ...args)
    }
  }

  fatal(...args: any[]) {
    if (this.#level <= this.#levels.fatal) {
      console.log(this.prefix + kleur.magenta(' [FATAL]'), ...args)
    }
  }
}
