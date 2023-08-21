import type {
  Client,
  Config,
  PrivateMessageEvent,
  GroupMessageEvent,
  DiscussMessageEvent,
} from 'icqq'

export type AnyFunc = (...args: any[]) => any

export type DeviceMode = 'sms' | 'qrcode'
export type LoginMode = 'password' | 'qrcode'
export type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface ClientWithApis extends Client {
  apis: {
    [x: string]: AnyFunc
  }
}

export type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
export type AdminArray = [mainAdmin: number, ...subAdmins: number[]]
export type AllMessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
export type OicqMessageHandler = (event: AllMessageEvent) => any
export type BotHandler = (bot: ClientWithApis) => undefined | void | ((bot: ClientWithApis) => any)

export type MessageHandler<T extends 'all' | 'group' | 'private' = 'all'> = T extends 'all'
  ? (event: AllMessageEvent) => any
  : T extends 'group'
  ? (event: GroupMessageEvent) => any
  : T extends 'private'
  ? (event: PrivateMessageEvent) => any
  : never

export type CommandHandler<T extends 'all' | 'group' | 'private' = 'all'> = T extends 'all'
  ? (event: AllMessageEvent, params: string[], options: { [arg: string]: any }) => any
  : T extends 'group'
  ? (event: GroupMessageEvent, params: string[], options: { [arg: string]: any }) => any
  : T extends 'private'
  ? (event: PrivateMessageEvent, params: string[], options: { [arg: string]: any }) => any
  : never

export type MessageCmdHandler = (
  event: AllMessageEvent,
  params: string[],
  options: {
    [arg: string]: any
  },
) => any

export interface PluginConf {
  debug?: boolean
  enableGroups?: number[]
  enableFriends?: number[]
}

export interface BotConfig {
  uin: number
  platform: Platform
  admins: AdminArray
  login_mode: LoginMode
  device_mode?: DeviceMode
  log_level?: Level
  password?: string
  plugins?: string[]
  oicq_config?: Config
}
