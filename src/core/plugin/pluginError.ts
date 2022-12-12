import log4js from 'log4js'

import { colors } from '@src/utils'

/** KiviBot 插件错误类 */
export class KiviPluginError extends Error {
  name = 'KiviPluginError'
  pluginName: string
  message: string

  constructor(name: string, message?: string) {
    super()
    this.pluginName = name
    this.message = message ?? ''
  }

  log() {
    const logger = log4js.getLogger('plugin')
    logger.error(`插件 ${colors.cyan(this.pluginName)} 抛出错误: ${this.message}`)
  }
}
