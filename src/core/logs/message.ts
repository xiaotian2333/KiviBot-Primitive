import { colors } from '@src/utils'
import { KiviLogger } from '@/logger'
import { kiviConf } from '@/config'

import type { AllMessageEvent } from '@/plugin'

const TypeMap = {
  private: '私',
  group: '群',
  discuss: '组'
} as const

/** 消息监听函数，打印框架日志 */
export async function messageHandler(e: AllMessageEvent) {
  const { sender, message_type } = e

  const type = TypeMap[e.message_type]
  const nick = `${sender.nickname}(${sender.user_id})`

  let head: string

  if (message_type === 'private') {
    // 私聊消息
    head = `↓ [${type}:${nick}]`
  } else if (message_type === 'discuss') {
    // 讨论组消息
    const discuss = `${e.discuss_name}(${e.discuss_id})`
    head = `↓ [${type}:${discuss}:${nick}]`
  } else {
    // 群聊消息
    const group = `${e.group_name}(${e.group_id})`
    head = `↓ [${type}:${group}-${nick}]`
  }

  const message = kiviConf.message_mode === 'detail' ? e.toString() : e.raw_message

  KiviLogger.info(`${colors.gray(head)} ${message}`)
}
