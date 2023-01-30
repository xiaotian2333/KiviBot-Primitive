import log4js from 'log4js'

import { colors } from '@/utils'

/** miobot 插件错误类 */
export class MioPluginError extends Error {
  public name = 'MioPluginError'
  public pluginName: string
  public message: string

  constructor(name: string, message?: string) {
    super()

    this.pluginName = name
    this.message = message ?? ''
  }

  log() {
    const logger = log4js.getLogger('plugin')
    const info = `插件 ${colors.cyan(this.pluginName)} 抛出错误: ${this.message}`
    logger.error(info)
    return this.message
  }
}
