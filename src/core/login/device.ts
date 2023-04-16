import fs from 'fs-extra'
import path from 'node:path'
import prompts from 'prompts'

import type { KeliConf } from '@/core'
import type { Client } from 'icqq'

import { KeliLogger } from '@/core'
import { OicqDataDir } from '@/path'
import { colors } from '@/utils'

/** 设备锁验证监听处理函数 */
export async function deviceHandler(
  this: Client,
  device_mode: KeliConf['device_mode'],
  event: { url: string; phone: string }
) {
  const info = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    KeliLogger.warn(msg, ...args)
  }

  const phone = colors.cyan(event.phone)

  if (device_mode === 'sms') {
    info(`press Enter to send sms code to ${phone}`)

    process.stdin.once('data', async () => {
      this.sendSmsCode()

      info(`sms code has been sent to ${phone}, press Enter after input`)

      const { sms } = await prompts({
        type: 'text',
        name: 'sms',
        format: (sms: string) => sms.trim(),
        validate: (sms: string) => (sms.trim() === '' ? 'sms code cannot be empty' : true),
        message: `please input sms code（${phone}）`
      })

      this.submitSmsCode(sms)
    })
  } else {
    fs.writeFileSync(path.join(OicqDataDir, 'url.txt'), event.url)

    info(`open url below to verify device lock, or open \`data/oicq/url.txt\` file to copy\n`)
    console.log(colors.cyan(event.url) + '\n')
    info(`press Enter after the verification has finished`)

    process.stdin.once('data', () => this.login())
  }
}
