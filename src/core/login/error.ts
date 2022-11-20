import { LoginErrorCode } from 'oicq'

import { KiviLogger } from '@/log'

import type { Client } from 'oicq'

/** 登录错误事件监听处理函数 */
export function errorHandler(this: Client, { code, message }: { code: number; message: string }) {
  const error = (msg: any, ...args: any[]) => {
    this.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  const warn = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    KiviLogger.warn(msg, ...args)
  }

  if (code === LoginErrorCode.AccountFrozen) {
    error(`账号 ${this.uin} 被冻结，请解冻后重新登录`)
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongPassword) {
    error('密码错误，请重新生成正确的配置文件')
    process.exit(0)
  }

  if (code === LoginErrorCode.TooManySms) {
    warn('验证码发送过于频繁，请稍后再尝试登录')
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongSmsCode) {
    error('短信验证码输入有误，请退出重试')
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongTicket) {
    error('`ticket` 输入有误，请退出重试')
    process.exit(0)
  }

  error(`登录错误，错误码：${code}，错误信息：${message}`)
}
