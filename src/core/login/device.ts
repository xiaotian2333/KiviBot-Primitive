import clipboard from 'clipboardy'
import prompts from 'prompts'

import { MioLogger } from '@/core'
import { colors } from '@/utils'

import type { MioConf } from '@/core'
import type { Client } from 'movo'

/** 设备锁验证监听处理函数 */
export async function deviceHandler(
  this: Client,
  device_mode: MioConf['device_mode'],
  event: { url: string; phone: string }
) {
  const info = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    MioLogger.warn(msg, ...args)
  }

  const phone = colors.cyan(event.phone)

  if (device_mode === 'sms') {
    info(`需要验证设备锁，按 \`Enter\` 键发送短信验证码到手机号 ${phone} 进行验证`)

    process.stdin.once('data', async () => {
      this.sendSmsCode()

      info(`短信验证码已发送至手机号 ${phone}，输入后按 \`Enter\` 键继续`)

      const { sms } = await prompts({
        type: 'text',
        name: 'sms',
        format: (sms: string) => sms.trim(),
        validate: (sms: string) => (sms.trim() === '' ? '短信验证码不为空' : true),
        message: `请输入短信验证码（${phone}）`
      })

      this.submitSmsCode(sms)
    })
  } else {
    clipboard.writeSync(event.url)

    info(`需要扫描二维码验证设备锁，二维码链接已自动复制到剪切板，你也可以手动复制：\n`)

    console.log(colors.cyan(event.url) + '\n')

    info(`扫码验证完成后，按 \`Enter\` 键继续...`)

    process.stdin.once('data', () => this.login())
  }
}
