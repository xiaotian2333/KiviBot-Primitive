import ora from 'ora'
import prompts from 'prompts'

import exitWithError from '@src/utils/exitWithError'

import type { Client } from 'oicq'

export const loading = ora({ color: 'cyan' })

/** 处理二维码扫描，自动轮询登录 */
export function qrCodeHandler(this: Client) {
  let hasShowReadMessage = false

  // 扫码轮询
  const interval_id = setInterval(async () => {
    const { retcode, uin } = await this.queryQrcodeResult()

    if (retcode === 53 && !hasShowReadMessage) {
      loading.succeed('扫码成功，等待确认...')
      hasShowReadMessage = true
      return
    }

    if (retcode === 54) {
      loading.warn('扫码登录被手动取消')

      clearInterval(interval_id)

      const { reScan } = await prompts({
        type: 'confirm',
        name: 'reScan',
        initial: true,
        message: '按 `Enter` 重新获取二维码'
      })

      if (reScan) {
        this.login()
      } else {
        exitWithError('已退出')
      }
    }

    if (retcode === 17) {
      loading.warn('二维码已过期，重新申请二维码')

      clearInterval(interval_id)

      this.login()
    }

    // 0: 扫码成功 48: 未过期，等待扫码 53: 已扫码未确认 54: 扫码后被手动取消 17: 二维码过期
    if (retcode === 0) {
      clearInterval(interval_id)

      if (uin === this.uin) {
        loading.succeed('扫码授权登录成功')
        this.login()
        return
      }

      loading.warn('你小子能不能看清账号再扫啊（扫码账号与登录账号不一致）')

      const { reScan } = await prompts({
        type: 'confirm',
        name: 'reScan',
        initial: true,
        message: '按 `Enter` 重新获取二维码'
      })

      if (reScan) {
        this.login()
      } else {
        exitWithError('已退出')
      }
    }
  }, 1000)

  loading.color = 'cyan'
  loading.start(`等待 ${this.uin} 扫描二维码`)
}
