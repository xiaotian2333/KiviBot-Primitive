import { colors } from './colors'

/** MioBot 规范化输出 */
export const notice = {
  /** 输出 MioBot 规范化的提示消息 */
  info: (msg: string, newLine = false) => {
    console.log(`${newLine ? '\n' : ''}${colors.cyan('info:')} ${msg}`)
  },
  /** 输出 MioBot 规范化的警告消息 */
  warn: (msg: string, newLine = false) => {
    console.log(`${newLine ? '\n' : ''}${colors.yellow('warn:')} ${msg}`)
  },
  /** 输出 MioBot 规范化的成功消息 */
  success: (msg: string, newLine = false) => {
    console.log(`${newLine ? '\n' : ''}${colors.green('success:')} ${msg}`)
  },
  /** 输出 MioBot 规范化的错误消息 */
  error: (msg: string, newLine = false) => {
    console.log(`${newLine ? '\n' : ''}${colors.red('error:')} ${msg}`)
  }
}
