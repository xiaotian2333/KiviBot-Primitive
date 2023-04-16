import fs from 'fs-extra'
import path from 'node:path'

import type { Client } from 'icqq'

import { KeliLogger } from '@/core'
import { OicqDataDir } from '@/path'
import { colors } from '@/utils'

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

    info(`open url below to capture ticket code, or open \`data/oicq/url.txt\` to copy url\n`)
    console.log(colors.cyan(url) + '\n')
    info(`press Enter after input the ticket code\n`)
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
