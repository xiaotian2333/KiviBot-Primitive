import type {
  CmdHandler,
  CronHandler,
  MessageHandler,
  MessageType,
  MountHandler,
} from '@kivi-dev/types'

export type HandlerMap<T extends MessageType> = Record<string, CmdHandler<T>>

export const defineMountHandler = (handler: MountHandler) => handler
export const defineCronHandler = (handler: CronHandler) => handler
export const defineCmdMap = <T extends MessageType>(cmdMap: HandlerMap<T>) => cmdMap
export const defineCmdHandler = <T extends MessageType>(handler: CmdHandler<T>) => handler
export const defineMatchHandler = <T extends MessageType>(handler: MessageHandler<T>) => handler
export const defineMsgHandler = <T extends MessageType>(handler: MessageHandler<T>) => handler
