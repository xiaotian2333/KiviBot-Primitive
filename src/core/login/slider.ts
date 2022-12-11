import clipboard from 'clipboardy'

import { colors } from '@src/utils'
import { KiviLogger } from '@/logger'

import type { Client } from 'oicq'

interface SliderEvent {
  url: string
  isFirst: boolean
}

/** 滑块事件监听处理函数 */
export function sliderHandler(this: Client, { url, isFirst }: SliderEvent) {
  const info = (msg: any, ...args: any[]) => {
    this.logger.warn(msg, ...args)
    KiviLogger.warn(msg, ...args)
  }

  if (isFirst) {
    clipboard.writeSync(url)
    info(
      `need to verify slider, the verification link has been copied to clipboard, you can also copy url manually when needed: \n`
    )
    console.log(colors.cyan(url) + '\n')
    info(`press \`Enter\` after inputing \`ticket\`:\n`)
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
