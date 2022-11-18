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
}
