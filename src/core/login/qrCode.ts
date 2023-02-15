import { KeliLogger } from '@/core'

import type { Client } from 'movo'

/** 处理二维码扫描，自动轮询登录 */
export function qrCodeHandler(this: Client) {
  let hasShowReadMessage = false

  // 扫码轮询
  const interval_id = setInterval(async () => {
    const { retcode, uin } = await this.queryQrcodeResult()

    if (retcode === 53 && !hasShowReadMessage) {
      KeliLogger.info(`scanned successfully, waiting for confirmation...`)
      hasShowReadMessage = true
      return
    }

    if (retcode === 54) {
      KeliLogger.warn('confirmation has been cancelled by the account')
      KeliLogger.warn('press Enter to fetch qrcode again or exit keli')

      clearInterval(interval_id)

      process.stdin.once('data', () => this.login())
    }

    if (retcode === 17) {
      KeliLogger.warn('qrcode is expired, fetching again...')
      clearInterval(interval_id)
      await this.login()
    }

    // 0: 扫码成功 48: 未过期，等待扫码 53: 已扫码未确认 54: 扫码后被手动取消 17: 二维码过期
    if (retcode === 0) {
      clearInterval(interval_id)

      if (uin === this.uin) {
        KeliLogger.info(`bot account ${uin} verified successfully`)
        await this.login()
        return
      }

      KeliLogger.warn('the account you login differs from the scan one')
      KeliLogger.warn('press Enter to refetch qrcode after you are ready')

      process.stdin.once('data', () => this.login())
    }
  }, 1000)

  KeliLogger.info(`waiting bot account ${this.uin} to scan qrcode...`)
}
