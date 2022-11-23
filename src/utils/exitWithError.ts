import { notice } from './notice'

/** 停止 KiviBot 框架进程并输出规范化 KiviBot 错误信息 */
export function exitWithError(msg: string) {
  notice.error(msg)
  process.exit(1)
}
