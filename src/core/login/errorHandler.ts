import exitWithError from '@/utils/exitWithError'

/** 登录错误事件监听处理函数 */
export default function errorListener({ code, message }: { code: number; message: string }) {
  exitWithError(`登录错误，错误码：${code}，错误信息：${message}`)
}
