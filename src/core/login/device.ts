import { KiviLogger } from '@/log'
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
    info(`需要验证设备锁，按 \`Enter\` 键向绑定手机 ${event.phone} 发送验证码`)

    process.stdin.once('data', async () => {
      this.sendSmsCode()

      info(`验证码已发送至 ${event.phone}，输入验证码后按 \`Enter\` 键继续`)

      const { sms } = await prompts({
        type: 'number',
        name: 'sms',
        max: 999999,
        validate: (sms: number) => (!sms ? '验证码不为空' : true),
        message: `请输入短信验证码 (${event.phone})`
      })

      this.submitSmsCode(sms)
    })
  } else {
    clipboard.writeSync(event.url)

    info(
      `需要验证设备锁，已将扫码验证链接复制到剪切板，验证完成后按 \`Enter\` 键继续，如无法粘贴请手动复制：${event.url}`
    )

    process.stdin.once('data', () => this.login())
  }
}
