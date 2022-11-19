import { KiviLogger } from '../log'

/** 登录错误事件监听处理函数 */
export function errorHandler({ code, message }: { code: number; message: string }) {
  KiviLogger.error(`登录错误，错误码：${code}，错误信息：${message}`)
}
