import { LoginErrorCode } from 'oicq'

import { KiviLogger } from '@/logger'
import { exitWithError } from '@src/utils'

import type { Client } from 'oicq'

/** 登录错误事件监听处理函数 */
export function errorHandler(this: Client, { code, message }: { code: number; message: string }) {
  const error = (msg: any, ...args: any[]) => {
    this.logger.error(msg, ...args)
    KiviLogger.error(msg, ...args)
  }

  if (code === LoginErrorCode.AccountFrozen) {
    error(`the account ${this.uin} has been blocked, please try again after lifting`)
    process.exit(0)
  }

  if (code === LoginErrorCode.WrongPassword) {
    error('password is wrong, please generate correct config again via `kivi init --force`')
    process.exit(0)
  }

  if (code === LoginErrorCode.TooManySms) {
    exitWithError('too busy to send sms code again, please wait for a while')
  }

  if (code === LoginErrorCode.WrongSmsCode) {
    error('wrong sms code, please try again')
    process.exit(0)
  }

  error(`login error, code: ${code}, message: ${message}`)
}
