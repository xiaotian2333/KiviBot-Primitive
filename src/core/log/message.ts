import type { AllMessageEvent } from '@/core'

import { keliConf, KeliLogger } from '@/core'
import { colors } from '@/utils'

const TypeMap = {
  private: 'P',
  group: 'G',
  discuss: 'D'
} as const

/** 消息监听函数，打印框架日志 */
export async function messageHandler(event: AllMessageEvent) {
  const { sender, message_type } = event

  const type = TypeMap[event.message_type]
  const nick = `${sender.nickname}(${sender.user_id})`

  let head: string

  if (message_type === 'private') {
    // 私聊消息
    head = `↓ [${type}:${nick}]`
  } else if (message_type === 'discuss') {
    // 讨论组消息
    const discuss = `${event.discuss_name}(${event.discuss_id})`
    head = `↓ [${type}:${discuss}:${nick}]`
  } else {
    // 群聊消息
    const group = `${event.group_name}(${event.group_id})`
    head = `↓ [${type}:${group}-${nick}]`
  }

  const message = keliConf.message_mode === 'detail' ? event.toString() : event.raw_message

  KeliLogger.info(`${colors.gray(head)} ${message}`)
}
