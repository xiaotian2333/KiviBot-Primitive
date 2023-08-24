import type { CommandHandler, MessageHandler, MessageType } from '@kivi-dev/types'

export type HandlerMap<T extends MessageType = 'all'> = Record<string, CommandHandler<T>>

export function defineCmdMap<T extends 'all' | 'private' | 'group' = 'all'>(cmdMap: HandlerMap<T>) {
  return cmdMap
}

export function defineMsgHandler<T extends MessageType = 'all'>(handler: MessageHandler<T>) {
  return handler
}
