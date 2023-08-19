import { colors } from './colors.js'

/** keli 规范化输出 */
export const notice = {
  /** 输出 keli 规范化的提示消息 */
  info: (msg: string, newLine = false) => {
    console.info(`${newLine ? '\n' : ''}${colors.cyan('INFO:')} ${msg}`)
  },
  /** 输出 keli 规范化的警告消息 */
  warn: (msg: string, newLine = false) => {
    console.warn(`${newLine ? '\n' : ''}${colors.yellow('WARN:')} ${msg}`)
  },
  /** 输出 keli 规范化的成功消息 */
  success: (msg: string, newLine = false) => {
    console.log(`${newLine ? '\n' : ''}${colors.green('SUCCESS:')} ${msg}`)
  },
  /** 输出 keli 规范化的错误消息 */
  error: (msg: string, newLine = false) => {
    console.error(`${newLine ? '\n' : ''}${colors.red('ERROR:')} ${msg}`)
  }
}
