import { MioLogger } from '@/core'
import { colors } from '@/utils'

/** 下线监听函数，打印框架日志 */
export function offlineHandler({ message }: { message: string }) {
  MioLogger.fatal(colors.magenta(message))
}
