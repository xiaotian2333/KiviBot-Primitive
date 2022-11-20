import clipboard from 'clipboardy'

import { KiviLogger } from '@/log'

import type { Client } from 'oicq'

interface SliderEvent {
  url: string
  isFirst: boolean
}

/** 滑块事件监听处理函数 */
export function sliderHandler(this: Client, { url, isFirst }: SliderEvent) {
  if (isFirst) {
    // 复制链接到剪切板
    clipboard.writeSync(url)

    KiviLogger.info('需要滑块验证，已将链接复制到剪切板，请获取并输入 `ticket` 后按 `Enter` 键')
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
