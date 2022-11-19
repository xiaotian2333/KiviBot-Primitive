import type { Client } from 'oicq'

/** 滑块事件监听处理函数 */
export function sliderHandler(this: Client) {
  process.stdin.once('data', (data: Buffer) => {
    const ticket = String(data).trim()

    if (!ticket) {
      return sliderHandler
    }

    this.submitSlider(ticket)
  })
}
