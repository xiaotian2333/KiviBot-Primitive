import type { Client } from 'oicq'

/** 处理二维码扫描 */
export function qrCodeHandler(this: Client) {
  process.stdin.once('data', () => this.login())
}
