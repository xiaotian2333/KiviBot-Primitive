import type { Client } from 'oicq'
import type { KiviConf } from '../start'

/** 设备锁验证监听处理函数 */
export default function deviceHandler(
  this: Client,
  device_mode: KiviConf['device_mode'],
  event: { url: string; phone: string }
) {
  if (device_mode === 'sms') {
    console.log(`需要验证设备锁，按 Enter 键向 ${event.phone} 发送验证码`)

    process.stdin.once('data', () => {
      this.sendSmsCode()

      console.log(`验证码已发送至 ${event.phone}，输入验证码后按 Enter 键继续`)

      const inputSms = () => {
        process.stdin.once('data', (data: Buffer) => {
          const code = String(data).trim()

          if (!code) {
            return inputSms
          }

          this.submitSmsCode(code)
        })
      }

      inputSms()
    })
  } else {
    console.log(`请打开以下链接扫码完成设备锁验证，验证完按 Enter 键继续：${event.url}`)
    process.stdin.once('data', () => this.login())
  }
}
