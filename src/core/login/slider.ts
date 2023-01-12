import clipboard from 'clipboardy'

import { colors } from '@src/utils'
import type { Client } from 'oicq'
import { KiviLogger } from '@/logger'

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

    info(`需要验证滑块并抓取 ticket，链接已自动复制到剪切板，你也可以手动复制：\n`)

    console.log(colors.cyan(url) + '\n')

    info(`输入 ticket 后，按 \`Enter\` 键继续: \n`)
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
