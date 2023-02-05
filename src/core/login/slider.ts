import fs from 'fs-extra'
import path from 'node:path'

import { KeliLogger } from '@/core'
import { OicqDataDir } from '@/path'
import { colors } from '@/utils'

import type { Client } from 'movo'

interface SliderEvent {
  url: string
  isFirst: boolean
}

/** 滑块事件监听处理函数 */
export function sliderHandler(this: Client, { url, isFirst }: SliderEvent) {
  const info = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    KeliLogger.warn(msg, ...args)
  }

  if (isFirst) {
    fs.writeFileSync(path.join(OicqDataDir, 'url.txt'), url)

    info(`请访问以下链接验证滑块并抓取 ticket，若无法复制请打开 data/oicq/url.txt 文件进行复制\n`)
    console.log(colors.cyan(url) + '\n')
    info(`请输入抓取到的 ticket，然后按 \`Enter\` 键继续: \n`)
  }

  const inputTicket = () => {
    process.stdin.once('data', (data: Buffer) => {
      const ticket = String(data).trim()

      if (!ticket) {
        return inputTicket()
      }

      this.submitSlider(ticket)
    })
  }

  inputTicket()
}
