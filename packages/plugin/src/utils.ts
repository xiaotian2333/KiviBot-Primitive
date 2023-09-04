import type {
  CmdHandler,
  CronHandler,
  MessageHandler,
  MessageType,
  MountHandler,
} from '@kivi-dev/types'

export type HandlerMap<T extends MessageType = 'all'> = Record<string, CmdHandler<T>>

export type SubCmdAlias = Record<string, string | string[]>

export const defineMountHandler = (handler: MountHandler) => handler
export const defineCronHandler = (handler: CronHandler) => handler
export const defineCmdMap = <T extends MessageType = 'all'>(cmdMap: HandlerMap<T>) => cmdMap
export const defineCmdHandler = <T extends MessageType = 'all'>(handler: CmdHandler<T>) => handler
export const defineMatchHandler = <T extends MessageType = 'all'>(handler: MessageHandler<T>) =>
  handler
export const defineMsgHandler = <T extends MessageType = 'all'>(handler: MessageHandler<T>) =>
  handler

export const resolveSubCmdAlias = <T extends MessageType = 'all'>(
  cmd = '',
  handlerMap: HandlerMap<T>,
  alias: SubCmdAlias,
) => {
  if (handlerMap[cmd]) {
    return handlerMap[cmd]
  }

  for (const [key, value] of Object.entries(alias)) {
    if (cmd === value) {
      return handlerMap[key] || null
    }

    if (Array.isArray(value) && value.includes(cmd)) {
      return handlerMap[key] || null
    }
  }

  return null
}
