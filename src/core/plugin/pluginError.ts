import { log4js } from 'movo'

import { colors } from '@/utils'

/** keli 插件错误类 */
export class PluginError extends Error {
  public name = 'PluginError'
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
