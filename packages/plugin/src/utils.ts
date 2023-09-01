import type {
  CmdHandler,
  CronHandler,
  MessageHandler,
  MessageType,
  MountHandler,
} from '@kivi-dev/types'

export type HandlerMap<T extends MessageType = 'all'> = Record<string, CmdHandler<T>>

export const defineMountHandler = (handler: MountHandler) => handler
export const defineCronHandler = (handler: CronHandler) => handler
export const defineCmdMap = <T extends MessageType = 'all'>(cmdMap: HandlerMap<T>) => cmdMap
export const defineCmdHandler = <T extends MessageType = 'all'>(handler: CmdHandler<T>) => handler
export const defineMatchHandler = <T extends MessageType = 'all'>(handler: MessageHandler<T>) =>
  handler
export const defineMsgHandler = <T extends MessageType = 'all'>(handler: MessageHandler<T>) =>
  handler
