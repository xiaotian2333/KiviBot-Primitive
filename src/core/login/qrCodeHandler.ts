import type { Client } from 'oicq'

/** 处理二维码扫描 */
export default function handlerQRcode(this: Client) {
  process.stdin.once('data', () => this.login())
}
