import type { CommandHandler, MessageType } from '@kivi-dev/types'

export type HandlerMap<T extends MessageType = 'all'> = Record<string, CommandHandler<T>>

export function defineCmdMap<T extends 'all' | 'private' | 'group' = 'all'>(cmdMap: HandlerMap<T>) {
  return cmdMap
}
