import { LoginErrorCode } from 'movo'

import { KeliLogger } from '@/core'

import type { Client } from 'movo'

/** 登录错误事件监听处理函数 */
export function errorHandler(this: Client, { code, message }: { code: number; message: string }) {
  if (code === LoginErrorCode.AccountFrozen) {
    KeliLogger.error(`Bot 账号 ${this.uin} 被冻结，请在解除冻结后再尝试登录`)
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongPassword) {
    KeliLogger.error('账号密码错误，请通过 `keli init --force` 重新生成正确的配置文件')
    process.exit(0)
  }

  if (code === LoginErrorCode.TooManySms) {
    KeliLogger.error('验证码发送过于频繁，请稍后再试')
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongSmsCode) {
    KeliLogger.error('短信验证码错误，验证失败，请重新尝试')
    process.exit(0)
  }

  KeliLogger.error(`登录错误，错误码: ${code}，错误信息: ${message}`)
}
