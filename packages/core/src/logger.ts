import { kleur, dayjs } from '@kivi-dev/shared'

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

  get time() {
    return kleur.green(`[${dayjs().format('MM/DD HH:mm:ss')}]`)
  }

  get tag() {
    const color = this.#name === 'Client' ? 'yellow' : 'cyan'
    return this.#name ? kleur[color](` [${this.#name}]`) : ''
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
      console.log(this.time + kleur.gray(' [TRACE]') + this.tag, ...args)
    }
  }

  debug(...args: any[]) {
    if (this.#level <= this.#levels.debug) {
      console.log(this.time + kleur.cyan(' [DEBUG]') + this.tag, ...args)
    }
  }

  info(...args: any[]) {
    if (this.#level <= this.#levels.info) {
      console.log(this.time + kleur.green(' [INFO]') + this.tag, ...args)
    }
  }

  log(...args: any[]) {
    return this.info(...args)
  }

  warn(...args: any[]) {
    if (this.#level <= this.#levels.warn) {
      console.log(this.time + kleur.yellow(' [WARN]') + this.tag, ...args)
    }
  }

  error(...args: any[]) {
    if (this.#level <= this.#levels.error) {
      console.log(this.time + kleur.red(' [ERROR]') + this.tag, ...args)
    }
  }

  fatal(...args: any[]) {
    if (this.#level <= this.#levels.fatal) {
      console.log(this.time + kleur.magenta(' [FATAL]') + this.tag, ...args)
    }
  }
}
