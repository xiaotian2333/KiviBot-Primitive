import { colors } from '@src/utils'
import { KiviLogger } from '@/logger'

/** 下线监听函数，打印框架日志 */
export function offlineHandler({ message }: { message: string }) {
  KiviLogger.fatal(colors.magenta(message))
}
