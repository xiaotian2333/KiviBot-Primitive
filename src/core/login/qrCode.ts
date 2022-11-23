import { KiviLogger } from '@/logger'

import type { Client } from 'oicq'

/** 处理二维码扫描，自动轮询登录 */
export function qrCodeHandler(this: Client) {
  let hasShowReadMessage = false

  // 扫码轮询
  const interval_id = setInterval(async () => {
    const { retcode, uin } = await this.queryQrcodeResult()

    if (retcode === 53 && !hasShowReadMessage) {
      KiviLogger.info(`扫码成功，等待确认...`)
      hasShowReadMessage = true
      return
    }

    if (retcode === 54) {
      KiviLogger.warn('扫码授权被手动取消，流程结束')
      KiviLogger.warn('按 `Enter` 键重新获取二维码，Ctrl + C 退出框架')

      clearInterval(interval_id)

      process.stdin.once('data', () => this.login())
    }

    if (retcode === 17) {
      KiviLogger.warn('二维码已过期，重新申请二维码')
      clearInterval(interval_id)
      this.login()
    }

    // 0: 扫码成功 48: 未过期，等待扫码 53: 已扫码未确认 54: 扫码后被手动取消 17: 二维码过期
    if (retcode === 0) {
      clearInterval(interval_id)

      if (uin === this.uin) {
        KiviLogger.info(`账号 ${uin} 扫码授权成功`)
        this.login()
        return
      }

      KiviLogger.warn('你小子能不能看清账号再扫啊（扫码账号与登录账号不一致）')
      KiviLogger.warn('确认账号正确后按 `Enter` 键重新获取二维码')

      process.stdin.once('data', () => this.login())
    }
  }, 1000)

  KiviLogger.info(`等待账号 ${this.uin} 扫描二维码`)
}
