import { KiviLogger } from '@/logger'
import clipboard from 'clipboardy'
import prompts from 'prompts'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

/** 设备锁验证监听处理函数 */
export async function deviceHandler(
  this: Client,
  device_mode: KiviConf['device_mode'],
  event: { url: string; phone: string }
) {
  const info = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    KiviLogger.warn(msg, ...args)
  }

  if (device_mode === 'sms') {
    info(`need to verify device lock, press \`Enter\` to send sms to ${event.phone}`)

    process.stdin.once('data', async () => {
      this.sendSmsCode()

      info(`sms code has been sent to ${event.phone}, press \`Enter\` to continue after input`)

      const { sms } = await prompts({
        type: 'number',
        name: 'sms',
        max: 999999,
        validate: (sms: number) => (!sms ? 'sms code is required' : true),
        message: `input sms code (${event.phone})`
      })

      this.submitSmsCode(sms)
    })
  } else {
    clipboard.writeSync(event.url)

    info(
      `need to verify device lock, the verification link has been copied to clipboard, press \`Enter\` after verification, you can also copy it manually when needed: ${event.url}`
    )

    process.stdin.once('data', () => this.login())
  }
}
