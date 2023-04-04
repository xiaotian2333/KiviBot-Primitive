import { LoginErrorCode } from 'movo'

import type { Client } from 'movo'

import { KeliLogger } from '@/core'

/** 登录错误事件监听处理函数 */
export function errorHandler(this: Client, { code, message }: { code: number; message: string }) {
  if (code === LoginErrorCode.AccountFrozen) {
    KeliLogger.error(`Bot account ${this.uin} has been blocked, try again after unblocked`)
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongPassword) {
    KeliLogger.error('password is wrong, use `keli init` to generate config file again')
    process.exit(0)
  }

  if (code === LoginErrorCode.TooManySms) {
    KeliLogger.error("It's too busy to send sms code")
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongSmsCode) {
    KeliLogger.error('sms code is wrong, try again')
    process.exit(0)
  }

  KeliLogger.error(`login error, error code: ${code}, error msg: ${message}`)
}
