import { KiviLogger } from '@/log'
import { colors } from '@src/utils'

/** 下线监听函数，打印框架日志 */
export function offlineHandler({ message }: { message: string }) {
  KiviLogger.fatal(colors.magenta(message))
}
