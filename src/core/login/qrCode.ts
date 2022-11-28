import { KiviLogger } from '@/logger'

import type { Client } from 'oicq'

/** 处理二维码扫描，自动轮询登录 */
export function qrCodeHandler(this: Client) {
  let hasShowReadMessage = false

  // 扫码轮询
  const interval_id = setInterval(async () => {
    const { retcode, uin } = await this.queryQrcodeResult()

    if (retcode === 53 && !hasShowReadMessage) {
      KiviLogger.info(`successfully scanned, wait for confirmation...`)
      hasShowReadMessage = true
      return
    }

    if (retcode === 54) {
      KiviLogger.warn('qrcode verification cancelled by the user')
      KiviLogger.warn('press `Enter` to fetch qrcode again')

      clearInterval(interval_id)

      process.stdin.once('data', () => this.login())
    }

    if (retcode === 17) {
      KiviLogger.warn('qrcode expired, fetching again...')
      clearInterval(interval_id)
      this.login()
    }

    // 0: 扫码成功 48: 未过期，等待扫码 53: 已扫码未确认 54: 扫码后被手动取消 17: 二维码过期
    if (retcode === 0) {
      clearInterval(interval_id)

      if (uin === this.uin) {
        KiviLogger.info(`${uin} verify successfully`)
        this.login()
        return
      }

      KiviLogger.warn('incorrect account (scan account diff from login account)')
      KiviLogger.warn('press `Enter` again to fetch qrcode when ready to scan')

      process.stdin.once('data', () => this.login())
    }
  }, 1000)

  KiviLogger.info(`waiting ${this.uin} to scan qrcode`)
}
