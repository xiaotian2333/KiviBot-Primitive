import clipboard from 'clipboardy'

import { KiviLogger } from '@/logger'

import type { Client } from 'oicq'

interface SliderEvent {
  url: string
  isFirst: boolean
}

/** 滑块事件监听处理函数 */
export function sliderHandler(this: Client, { url, isFirst }: SliderEvent) {
  if (isFirst) {
    clipboard.writeSync(url)
    KiviLogger.info(
      `need to verify slider, the verification link has been copied to clipboard, press \`Enter\` after inputing \`ticket\`, you can also copy url manually when needed: ${url}`
    )
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
